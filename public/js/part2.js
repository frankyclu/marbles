/* global new_block */
/* global formatDate */
/* global nDig */
/* global randStr */
/* global bag */
/* global $ */
var ws = {};
var user = {username: bag.setup.USER1};
var bgcolors = ["whitebg", "blackbg", "redbg", "greenbg", "bluebg", "purplebg", "pinkbg", "orangebg", "yellowbg"];

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	$("input[name='name']").val('r' + randStr(6));
	$("select option[value='" + bag.setup.USER1 + "']").attr('selected', true);
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$("#submit").click(function(){
		var obj = 	{
						type: "create",
						name: $("input[name='name']").val(),
						color: $(".colorSelected").attr('color'),
						size: $("select[name='size']").val(),
						user: $("select[name='user']").val(),
						v: 2
					};
		if(obj.user && obj.name && obj.color){
			console.log('creating marble, sending', obj);
			ws.send(JSON.stringify(obj));
			$(".panel").hide();
			$("#homePanel").show();
			$(".colorValue").html('Color');											//reset
			for(var i in bgcolors) $(".createball").removeClass(bgcolors[i]);			//reset
			$(".createball").css("border", "2px dashed #fff");						//reset
		}
		return false;
	});

	$("#homeLink").click(function(){
		console.log('marbles:', bag.marbles);
	});
	
	$("#createLink").click(function(){
		$("input[name='name']").val('r' + randStr(6));
	});
	
	$("#tradeLink").click(function(){
		set_my_color_options(user.username);
		ws.send(JSON.stringify({type: "get_open_trades", v: 2}));
	});
	
	
	//marble color picker
	$(document).on("click", ".colorInput", function(){
		$('.colorOptionsWrap').hide();											//hide any others
		$(this).parent().find('.colorOptionsWrap').show();
	});
	$(document).on("click", ".colorOption", function(){
		var color = $(this).attr('color');
		var html = '<span class="fa fa-circle colorSelected ' + color + '" color="' + color +'"></span>';
		
		$(this).parent().parent().find('.colorValue').html(html);
		$(this).parent().hide();

		for(var i in bgcolors) $(".createball").removeClass(bgcolors[i]);		//remove prev color
		$(".createball").css("border", "0").addClass(color + 'bg');				//set new color
	});
	
	
	//drag and drop marble
	$("#user2wrap, #user1wrap, #trashbin").sortable({connectWith: ".sortable"}).disableSelection();
	$("#user2wrap").droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER2){
				$(ui.draggable).addClass("invalid");
				transfer($(ui.draggable).attr('id'), bag.setup.USER2);
			}
		}
	});
	$("#user1wrap").droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER1){
				$(ui.draggable).addClass("invalid");
				transfer($(ui.draggable).attr('id'), bag.setup.USER1);
			}
		}
	});
	$("#trashbin").droppable({drop:
		function( event, ui ) {
			var id = $(ui.draggable).attr('id');
			if(id){
				console.log('removing marble', id);
				var obj = 	{
								type: "remove",
								name: id,
								v: 2
							};
				ws.send(JSON.stringify(obj));
				$(ui.draggable).fadeOut();
				setTimeout(function(){
					$(ui.draggable).remove();
				}, 300);
			}
		}
	});
	
	
	//login events
	$("#whoAmI").click(function(){													//drop down for login
		if($("#userSelect").is(":visible")){
			$("#userSelect").fadeOut();
		}
		else{
			$("#userSelect").fadeIn();
		}
	});
	
	$(".userLine").click(function(){												//log in as someone else
		var name = $(this).attr("name");
		user.username = name.toLowerCase();
		$("#userField").html("HI " + user.username.toUpperCase() + ' ');
		$("#userSelect").fadeOut(300);
		$("select option[value='" + user.username +"']").attr('selected', true);
		//ws.send(JSON.stringify({type: "get_open_trades", v: 2}));
		set_my_color_options(user.username);
		build_trades(bag.trades);
	});
	
	
	//trade events
	$("#setupTradeButton").click(function(){
		build_trades(bag.trades);
		$(".inactiveButton").removeClass("inactiveButton");
		$("#viewTradeButton").addClass("inactiveButton");
		$("#openTrades").fadeOut();
		$("#createTrade").fadeIn();
	});
	
	$("#viewTradeButton").click(function(){
		build_trades(bag.trades);
		$(".inactiveButton").removeClass("inactiveButton");
		$("#setupTradeButton").addClass("inactiveButton");
		$("#openTrades").fadeIn();
		$("#createTrade").fadeOut();
	});
	
	$(".removeWilling:first").hide();
	$("#addMarbleButton").click(function(){
		var count = 0;
		var marble_count = 0;
		$(".willingWrap").each(function(){
			count++;
		});
		for(var i in bag.marbles){
			if(bag.marbles[i].user.toLowerCase() == user.username.toLowerCase()){
				marble_count++;
			}
		}
		if(count+1 <= marble_count && count <= 3){									//lets limit the total number... might get out of hand
			var temp = $(".willingWrap:first").html();
			$(".willingWrap:first").parent().append('<div class="willingWrap">' + temp + '</div>');
			$(".removeWilling").show();
			$(".removeWilling:first").hide();
		}
	});
	$(document).on("click", ".removeWilling", function(){
		$(this).parent().remove();
	});
	
	$("#tradeSubmit").click(function(){
		var msg = 	{
						type: 'open_trade',
						v: 2,
						user: user.username,
						want: {
							color: $("#wantColorWrap").find(".colorSelected").attr("color"),
							size: $("select[name='want_size']").val()
						},
						willing: []
					};
					
		$(".willingWrap").each(function(){
			//var q = $(this).find("select[name='will_quantity']").val();
			var color = $(this).find(".colorSelected").attr('color');
			var size = $(this).find("select[name='will_size']").val();
			//console.log('!', q, color, size);
			var temp = 	{
							color: color,
							size: size
						};
			msg.willing.push(temp);
		});
		
		console.log('sending', msg);
		ws.send(JSON.stringify(msg));
		$(".panel").hide();
		$("#homePanel").show();
		$(".colorValue").html('Color');
	});
	
	$(document).on("click", ".confirmTrade", function(){
		console.log('trading...');
		var i = $(this).attr('trade_pos');
		var x = $(this).attr('willing_pos');
		var msg = 	{
						type: 'perform_trade',
						v: 2,
						id: bag.trades[i].timestamp.toString(),
						opener:{											//marble he is giving up
							user: bag.trades[i].user,
							color: bag.trades[i].willing[x].color,
							size: bag.trades[i].willing[x].size.toString(),
						},
						closer:{											//marble hs ig giving up
							user: user.username,							//guy who is logged in
							name: $(this).attr('name'),
							color: '',										//dsh to do, add these and remove above
							size: ''
						}
					};
		ws.send(JSON.stringify(msg));
		$("#notificationPanel").animate({width:'toggle'});
	});
	
	$(document).on("click", ".willingWrap .colorOption", function(){
		set_my_size_options(user.username, this);
	});
	
	$("input[name='showMyTrades']").change(function(){
		if($(this).is(":checked")){
			$("#myTradesTable").fadeIn();
		}
		else{
			$("#myTradesTable").fadeOut();
		}
	});
	
	$(document).on("click", ".removeTrade", function(){
		var trade = find_trade($(this).attr('trade_timestamp'));
		$(this).parent().parent().addClass("invalid");
		console.log('trade', trade);
		var msg = 	{
						type: 'remove_trade',
						v: 2,
						id: trade.timestamp.toString(),
					};
		ws.send(JSON.stringify(msg));
	});
});


// =================================================================================
// Helper Fun
// =================================================================================
//transfer selected ball to user
function transfer(marbleName, user){
	if(marbleName){
		console.log('transfering', marbleName);
		var obj = 	{
						type: "transfer",
						name: marbleName,
						user: user,
						v: 2
					};
		ws.send(JSON.stringify(obj));
	}
}

function sizeMe(mm){
	var size = 'Large';
	if(Number(mm) == 16) size = 'Small';
	return size;
}

function find_trade(timestamp){
	for(var i in bag.trades){
		if(bag.trades[i].timestamp){
			return bag.trades[i];
		}
	}
	return null;
}

function find_valid_marble(user, color, size){				//return true if user owns marble of this color and size
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == user.toLowerCase()){
			//console.log('!', bag.marbles[i].color, color.toLowerCase(), bag.marbles[i].size, size);
			if(bag.marbles[i].color.toLowerCase() == color.toLowerCase() && bag.marbles[i].size == size){
				return bag.marbles[i].name;
			}
		}
	}
	return null;
}


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	connect();
	function connect(){
		var wsUri = "ws://" + bag.setup.SERVER.EXTURI;
		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log("WS CONNECTED");
		ws.send(JSON.stringify({type: "chainstats", v:2}));
		ws.send(JSON.stringify({type: "get_open_trades", v: 2}));
		ws.send(JSON.stringify({type: "get", v:2}));
	}

	function onClose(evt){
		console.log("WS DISCONNECTED", evt);
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var data = JSON.parse(msg.data);
			console.log('rec', data);
			if(data.marble){
				build_ball(data.marble);
				set_my_color_options(user.username);
			}
			else if(data.msg === 'chainstats'){
				var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				$("#blockdate").html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp = { 
								id: nDig((data.chainstats.height - 1), 3), 
								blockstats: data.blockstats
							};
				new_block(temp);									//send to blockchain.js
			}
			else if(data.msg === 'reset'){							//clear marble knowledge, prepare of incoming marble states
				$("#user2wrap").html('');
				$("#user1wrap").html('');
			}
			else if(data.msg === 'open_trades'){
				build_trades(data.open_trades);
			}
		}
		catch(e){
			console.log('ERROR', e);
			//ws.close();
		}
	}

	function onError(evt){
		console.log('ERROR ', evt.data);
	}

	function sendMessage(message){
		console.log("SENT: " + message);
		ws.send(message);
	}
}


// =================================================================================
//	UI Building
// =================================================================================
function build_ball(data){
	var html = '';
	var colorClass = '';
	var size = 'fa-5x';
	
	if(!bag.marbles) bag.marbles = {};
	bag.marbles[data.name] = data;								//store the marble for posterity
	
	if(!$("#" + data.name).length){								//only populate if it doesn't exists
		if(data.size == 16) size = 'fa-3x';
		if(data.color) colorClass = data.color.toLowerCase();
		
		html += '<span id="' + data.name +'" class=" fa fa-circle ' + size + ' ball ' + colorClass + '" title="' + data.name +'" user="' + data.user + '"></span>';
		if(data.user && data.user.toLowerCase() == bag.setup.USER1){
			$("#user1wrap").append(html);
		}
		else{
			$("#user2wrap").append(html);
		}
	}
	//console.log('marbles', bag.marbles);
	
	return html;
}

function build_trades(trades){
	var html = '';
	bag.trades = trades;						//store the trades for posterity
	console.log('trades:', bag.trades);
	
	for(var i in trades){
		for(var x in trades[i].willing){
			//console.log(trades[i]);
			var style = ' ';
			var buttonStatus = '';
			
			if(user.username.toLowerCase() != trades[i].user.toLowerCase()){				//don't show trades with myself
				var name = find_valid_marble(user.username, trades[i].want.color, trades[i].want.size);
				if(name == null) {								//don't allow trade if I don't have the correct marble
					style = 'invalid';
					buttonStatus = 'disabled="disabled"';
				}
				html += '<tr class="' + style +'">';
				html +=		'<td>' + formatDate(Number(trades[i].timestamp), '%M/%d %I:%m%P') + '</td>';
				html +=		'<td>1</td>';
				html +=		'<td><span class="fa fa-2x fa-circle ' + trades[i].want.color + '"></span></td>';
				html +=		'<td>' + sizeMe(trades[i].want.size) + '</td>';
				html +=		'<td>1</td>';
				html +=		'<td><span class="fa fa-2x fa-circle ' + trades[i].willing[x].color + '"></span></td>';
				html +=		'<td>' + sizeMe(trades[i].willing[x].size) + '</td>';
				html +=		'<td>';
				html +=			'<button type="button" class="confirmTrade altButton" ' + buttonStatus +' name="' + name + '" trade_pos="' + i + '" willing_pos="' + x + '">';
				html +=				'<span class="fa fa-exchange"> &nbsp;&nbsp;TRADE</span>';
				html +=			'</button>';
				html += 	'</td>';
				html += '</tr>';
			}
		}
	}
	if(html == '') html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
	$("#openTradesBody").html(html);
	
	build_my_trades(trades);
}

function build_my_trades(trades){
	var html = '';
	for(var i in trades){
		//console.log(trades[i]);
		var style = ' ';
		
		if(user.username.toLowerCase() == trades[i].user.toLowerCase()){				//only show trades with myself
			html += '<tr class="' + style +'">';
			html +=		'<td>' + formatDate(Number(trades[i].timestamp), '%M/%d %I:%m%P') + '</td>';
			html +=		'<td>1</td>';
			html +=		'<td><span class="fa fa-2x fa-circle ' + trades[i].want.color + '"></span></td>';
			html +=		'<td>' + sizeMe(trades[i].want.size) + '</td>';
			html +=		'<td>';
			for(var x in trades[i].willing){
				html +=		'<p>1 <span class="fa fa-2x fa-circle ' + trades[i].willing[x].color + '"></span>&nbsp; &nbsp;' + sizeMe(trades[i].willing[x].size) + '</p>';
			}
			html += 	'</td>';
			html +=		'<td><span class="fa fa-remove removeTrade" trade_timestamp="' + trades[i].timestamp + '"></span></td>';
			html += '</tr>';
		}
	}
	if(html == '') html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td></tr>';
	$("#myTradesBody").html(html);
}

function set_my_color_options(username){
	var has_colors = {};
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == username.toLowerCase()){		//mark it as needed
			has_colors[bag.marbles[i].color] = true;
		}
	}
	
	//console.log('has_colors', has_colors);
	var colors = ["white", "black", "red", "green", "blue", "purple", "pink", "orange", "yellow"];
	$(".willingWrap").each(function(){
		for(var i in colors){
			//console.log('checking if user has', colors[i]);
			if(!has_colors[colors[i]]) {
				//console.log('removing', colors[i]);
				$(this).find('.' + colors[i] + ':first').hide();
			}
			else {
				$(this).find('.' + colors[i] + ':first').show();
				//console.log('yep');
			}
		}
	});
}

function set_my_size_options(username, colorOption){
	var color = $(colorOption).attr('color');
	//console.log('color', color);
	var html = '';
	var sizes = {};
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == username.toLowerCase()){		//mark it as needed
			if(bag.marbles[i].color.toLowerCase() == color.toLowerCase()){
				sizes[bag.marbles[i].size] = true;
			}
		}
	}
	
	console.log('valid sizes:', sizes);
	for(var i in sizes){
		html += '<option value="' + i + '">' + sizeMe(i) + '</option>';					//build it
	}
	$(colorOption).parent().parent().next("select[name='will_size']").html(html);
}
