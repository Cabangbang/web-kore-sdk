function koreBotChat() {
    var bot = require('/KoreBot.js').instance();
    var botMessages = {
        message: "Message...",
        connecting: "Connecting...",
        reconnecting: "Reconnecting..."
    };
    var _botInfo = {};
    var helpers = {
        'nl2br': function nl2br(str){
            str = str.replace(/(?:\r\n|\r|\n)/g, '<br />');
            return str;
        }
    };
    function chatWindow(cfg) {
        this.config = {
            "chatTitle": "Kore Bot Chat",
            "container": "body",
            "botOptions": cfg.botOptions
        };
        if (cfg && cfg.chatContainer) {
            delete cfg.chatContainer;
        }
        this.config = $.extend(this.config, cfg);
        this.init();
    }

    chatWindow.prototype.init = function () {
        var me = this;
        _botInfo = me.config.botOptions.botInfo;
        me.config.botOptions.botInfo = {chatBot:_botInfo.name,taskBotId :_botInfo._id};
        var tempTitle = _botInfo.name + " Bot";
        me.config.botMessages = botMessages;
        
        me.config.chatTitle = me.config.botMessages.connecting;
        var chatWindowHtml = $(me.getChatTemplate()).tmpl(me.config);
        me.config.chatContainer = chatWindowHtml;
        
        me.config.chatTitle = tempTitle;
        bot.init(me.config.botOptions);
        me.render(chatWindowHtml);
    };
    
    chatWindow.prototype.destroy = function () {
        var me = this;
        if (me.config && me.config.chatContainer) {
            me.config.chatContainer.remove();
        }
    };
    
    chatWindow.prototype.resetWindow = function() {
        var me = this;
        me.config.chatContainer.find('.kore-chat-header h3').html( me.config.botMessages.reconnecting);
        me.config.chatContainer.find('.chat-container').html("");
        bot.init(me.config.botOptions);
    };
    
    chatWindow.prototype.bindEvents = function () {
        var me = this;
        var _chatContainer = me.config.chatContainer;
        _chatContainer.draggable({
                handle: _chatContainer.find(".kore-chat-header h3"),
                containment: "html"
        }).resizable({
                handles: "n, e, w, s",
                containment: "parent"
        });
		
        _chatContainer.off('keyup', '.chatInputBox').on('keyup', '.chatInputBox', function (event) {
            var _this = $(this);
            if (_this.text().trim() === "") {
                _chatContainer.find('.sendChat').addClass("disabled");
            } else
            {
                _chatContainer.find('.sendChat').removeClass("disabled");
            }
        });
        _chatContainer.off('keydown', '.chatInputBox').on('keydown', '.chatInputBox', function (event) {
            var _this = $(this);
            var _footerContainer = $(me.config.container).find('.kore-chat-footer');
            var _bodyContainer = $(me.config.container).find('.kore-chat-body');
            _bodyContainer.css('bottom', _footerContainer.outerHeight());
            if (!event.shiftKey && event.keyCode === 13) {
                event.preventDefault();
                me.sendMessage(_this);
                return;
            }
        });

        _chatContainer.off('click', '.sendChat').on('click', '.sendChat', function (event) {
            var _footerContainer = $(me.config.container).find('.kore-chat-footer');
            me.sendMessage(_footerContainer.find('.chatInputBox'));
        });

        _chatContainer.off('click', '.close-btn').on('click', '.close-btn', function (event) {
            me.destroy();
        });

        _chatContainer.off('click', '.minimize-btn').on('click', '.minimize-btn', function (event) {
            if (me.minimized === true) {
                _chatContainer.removeClass("minimize");
                me.minimized = false;
                _chatContainer.draggable({
                    handle: _chatContainer.find(".kore-chat-header h3"),
                    containment: "html"
                });
            } else
            {
                _chatContainer.addClass("minimize");
                _chatContainer.draggable("destroy");
                _chatContainer.find('.minimized').attr('title',"Talk to "+ me.config.chatTitle);
                me.minimized = true;
            }
        });
        
        _chatContainer.off('click', '.minimized').on('click', '.minimized', function (event) {
            _chatContainer.removeClass("minimize");
            me.minimized = false;
            _chatContainer.draggable({
                handle: _chatContainer.find(".kore-chat-header h3"),
                containment: "html"
            });
        });
        
        _chatContainer.off('click', '.reload-btn').on('click', '.reload-btn',function(event){
            $(this).addClass("disabled").prop('disabled',true);
            me.resetWindow();
        });
        bot.on("open", function (response) {
            var _chatInput = _chatContainer.find('.kore-chat-footer .chatInputBox');
            _chatContainer.find('.kore-chat-header h3').html(me.config.chatTitle).attr('title',me.config.chatTitle);
            _chatContainer.find('.kore-chat-header .disabled').prop('disabled',false).removeClass("disabled");
            _chatInput.focus();
        });
        
        bot.on("message", function (message) {
            var tempData = JSON.parse(message.data);

            if (tempData.type === "bot_response")
            {
                me.renderMessage(tempData);
            }
            if(tempData.replyto){
                var _msgEle = $('#msg_'+tempData.replyto);
                _msgEle.find('.message-status').addClass("recieved");
            }
        });
    };

    chatWindow.prototype.render = function (chatWindowHtml) {
        var me = this;
        $(me.config.container).append(chatWindowHtml);

        if (me.config.container !== "body") {
            $(me.config.container).addClass('pos-relative');
            $(me.config.chatContainer).addClass('pos-absolute');
        }

        me.bindEvents();
    };

    chatWindow.prototype.sendMessage = function (chatInput) {
        var me = this;
        if (chatInput.text().trim() === "") {
            return;
        }
        var _bodyContainer = $(me.config.chatContainer).find('.kore-chat-body');
        var _footerContainer = $(me.config.chatContainer).find('.kore-chat-footer');
        var clientMessageId = new Date().getTime();

        var msgData = {
            'type': "currentUser",
            "message": [{
                    'type': 'text',
                    'cInfo': {'body':chatInput.text()},
                    'clientMessageId': clientMessageId
                }]
        };

        var messageToBot = {};
        messageToBot["clientMessageId"] = clientMessageId;
        messageToBot["message"] = {body: chatInput.text(), attachments: []};
        messageToBot["resourceid"] = '/bot.message';

        bot.sendMessage(messageToBot, function messageSent() {

        });
        chatInput.html("");
        _bodyContainer.css('bottom', _footerContainer.outerHeight());

        me.renderMessage(msgData);
    };

    chatWindow.prototype.renderMessage = function (msgData) {
        var me = this;
        var _chatContainer = $(me.config.chatContainer).find('.chat-container'); 
        
        var messageHtml = $(me.getChatTemplate("message")).tmpl({
            'msgData': msgData,
            'helpers':helpers
        });

        _chatContainer.append(messageHtml);
        
        me.formatMessages(messageHtml);
        _chatContainer.animate({
            scrollTop: _chatContainer.prop("scrollHeight")
        }, 0);
    };
    
    chatWindow.prototype.formatMessages = function (msgContainer){
    /*adding target to a tags */
        $(msgContainer).find('a').attr('target','_blank');
    };
    
    chatWindow.prototype.getChatTemplate = function (tempType) {
        var chatFooterTemplate =
                '<div class="footerContainer pos-relative"> \
			<div class="chatInputBox" contenteditable="true" placeholder="${botMessages.message}"></div> \
			<div class="sendChat disabled">&#8626;</div> \
		</div>';

        var chatWindowTemplate = '<script id="chat_window_tmpl" type="text/x-jqury-tmpl"> \
			<div class="kore-chat-window"> \
                                <div class="minimized"><span class="messages"></span></div> \
				<div class="kore-chat-header"> \
					<h3 title="${chatTitle}">${chatTitle}</h3> \
					<div class="chat-box-controls"> \
                                                <button class="reload-btn" title="Reconnect">&#10227;</button> \
						<button class="minimize-btn" title="Minimize">&minus;</button> \
						<button class="close-btn" title="Close">&times;</button> \
					</div> \
				</div> \
				<div class="kore-chat-body"> \
					<ul class="chat-container"></ul> \
				</div> \
				<div class="kore-chat-footer">' + chatFooterTemplate + '</div> \
			</div> \
		</script>';

        var msgTemplate = ' <script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
			{{if msgData.message}} \
			{{each(key, msgItem) msgData.message}} \
                        {{if msgItem.cInfo && msgItem.type === "text"}} \
			<li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}}"> \
				<div class="messageBubble">\
                                    {{html helpers.nl2br(msgItem.cInfo.body)}} \
                                    <div class="message-status"></div> \
                                </div> \
			</li> \
                        {{/if}} \
			{{/each}} \
			{{/if}} \
		</scipt>';

        if (tempType === "message") {
            return msgTemplate;
        } else {
            return chatWindowTemplate;
        }
    };
    var chatInitialize;
    
    this.show = function (cfg) {
        if ($('body').find('.kore-chat-window').length > 0)
        {
            return false;
        }
        chatInitialize = new chatWindow(cfg);
        return this;
    };
    this.destroy = function () {
        if (chatInitialize && chatInitialize.destroy) {
            chatInitialize.destroy();
        }
    };
    return {
        show: show,
        destroy: destroy
    };
}