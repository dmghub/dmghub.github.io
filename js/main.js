$(document).ready( function() {
	d.data('timer', '0');
	timer();
});

var ch_to_int = {'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8};
var int_to_ch = ' abcdefgh';

var d = $(document);

var walketh = true;
var start_step = 0;

var sel_cell;
var Solution;
var mandatory_beat = [];

var beaten = [0, 0];
var board_orientation = true;

var board = [['b8', 'd8', 'f8', 'h8'],
			 ['a7', 'c7', 'e7', 'g7'],
			 ['b6', 'd6', 'f6', 'h6'],
			 ['a5', 'c5', 'e5', 'g5'],
			 ['b4', 'd4', 'f4', 'h4'],
			 ['a3', 'c3', 'e3', 'g3'],
			 ['b2', 'd2', 'f2', 'h2'],
			 ['a1', 'c1', 'e1', 'g1']];
var pairs = ['b8','g1','d8','e1','f8','c1','h8','a1','a7','h2','c7','f2',
			 'e7','d2','g7','b2','b6','g3','d6','e3','f6','c3','h6','a3',
			 'a5','h4','c5','f4','e5','d4','g5','b4'];		 

// TODO:
// подсветка обязательного хода при нажатии на противника при не законченом ходе
// бить сразу несколько шашек - указанием конечной точки
// проверка кто выиграл
// логгер ходов
// режим сдаться
// флаг кто ходит
// также перевернуть отображение результата битых шашек
// добавить звук ходов

//document.body.addEventListener("click", function(event) {
//    console.log(event.target.className);
//});

$(".b_ch:not(:hidden)").addClass("hide").fadeIn(1800).removeClass("hide");
$(".w_ch:not(:hidden)").addClass("hide").fadeIn(1800).removeClass("hide");


function rotate_board() {
	['.v_white', '.h_white', '.v_black', '.h_black'].forEach(function(it){$(it).toggleClass('hide')});

	for (var i = 0; i < pairs.length; i += 2) {
		var id1 = $('#' + pairs[i]);
		var id2 = $('#' + pairs[i+1]);

		if (id1[0].innerHTML || id2[0].innerHTML) {
			var tmp = id1[0].innerHTML;
			id1[0].innerHTML = id2[0].innerHTML;
			id2[0].innerHTML = tmp;
		}
		id2.attr('id', pairs[i]);
		id1.attr('id', pairs[i+1]);
	}

	var t = {'b': false, 'w': true};
	[".b_ch", ".b_king", ".w_ch", ".w_king"].forEach(function(it){$(".dc>"+it).click(function(){click_checker(this, t[it[1]])});});
}


function reset() {
	$(sel_cell).removeClass("dc_checked");
	
	if (Solution[0] == "beat") {
		for (var i = 1; i < Solution.length; ++i) {
			$(Solution[i][0]).removeClass("dc_possible");
		}
	} else {
		for (var i = 1; i < Solution.length; ++i) {
			$(Solution[i]).removeClass("dc_possible");
		}
	}
	start_step = 0;
}


function add(style) { this.addClass(style); }
function remove(style) { this.removeClass(style); }

function show_help() {
	// добавить запрет обработки кликов на шашки
	
	for (var i = 0; i < mandatory_beat.length; ++i) {

		var from = $(mandatory_beat[i][2]);
		//var what = $(mandatory_beat[i][1]);
		var to = $(mandatory_beat[i][0]);
		
		setTimeout(add.bind(from, 'dc_checked'), 0 + (1800*i));
		setTimeout(add.bind(to,'dc_possible'), 200 + (1800*i));
		setTimeout(remove.bind(to, 'dc_possible'), 700 + (1800*i));
		setTimeout(add.bind(to, 'dc_possible'), 1200 + (1800*i));
		setTimeout(remove.bind(to, 'dc_possible'), 1800 + (1800*i));
		setTimeout(remove.bind(from, 'dc_checked'), 1800 + (1800*i));
	}
}


$(".lc").click(function() {
	if (start_step == 1) reset();
});

$(".dc").click(function() { 
	//if (event.target.className == "b_ch" || event.target.className == "w_ch") return;

	var ch_idx = {'w': 1, 'b': 0};

	if (start_step == 1) {
		var dc_class = $(this).attr('class');

		if ("dc_possible" == dc_class.split(" ")[1]) {
			// move checker, unselect possible solution and checked cell
			var move_checker = $(sel_cell)[0].innerHTML;
			var ct = $(sel_cell).children().attr('class');

			$(sel_cell)[0].innerHTML = "";
			$(sel_cell).removeClass("dc_checked");

			
			if (is_transform_in_king(ct, $(this).attr('id'))) {
				$(this)[0].innerHTML = "<div class=\"" + ct[0] + "_king" + "\"></div>";
			} else {
				$(this)[0].innerHTML = move_checker;
			}

			$(this).children().click(function(){click_checker(this, ch_idx[ct[0]])});

			var type_step = Solution[0];
			if (type_step == "step") {
				for (var i = 1; i < Solution.length; ++i) {
					$(Solution[i]).removeClass("dc_possible");
				}
			} else if (type_step == "beat") {
				for (var i = 1; i < Solution.length; ++i) {
					$(Solution[i][0]).removeClass("dc_possible");

					if ('#'+$(this).attr('id') == Solution[i][0]) {
						beaten[ch_idx[$(Solution[i][1]).children().attr('class')[0]]]++;
						$(Solution[i][1])[0].innerHTML = "";
					}
					update_result();
				}
			}

			if (type_step == "beat") {
				var id = '#' + $(this).attr('id');
				var ct = $(id).children().attr('class');
				
				var s_solution = [];
				var b_solution = [];

				var col = +ch_to_int[id[1]];
				var row = +id[2];

				if (ct[2] == 'c') {
					['l', 'r'].forEach(function(it){check_square(col, row, b_solution, s_solution, it, ct, id);});
				
				} else {
					['tl', 'tr', 'bl', 'br'].forEach(function(it){check_diagonal(b_solution, s_solution, row, col, it, ct[0], id);});
				}
			}

			if (b_solution && b_solution.length != 0) {
				mandatory_beat = b_solution;
			} else {
				mandatory_beat.length = 0;	
				walketh = !walketh;

				var type = (walketh) ? 'w' : 'b';

				var chs = $(".dc>."+type+"_ch");

				var s_solution = [];
				var b_solution = [];

				for (var i = 0; i < chs.length; ++i) {
					var id = '#' + $(chs[i]).parent().attr('id');
					var ctype = $(id).children().attr('class');

					var col = +ch_to_int[id[1]];
					var row = +id[2];

					['l', 'r'].forEach(function(it){check_square(col, row, b_solution, s_solution, it, ctype, id);});
				}

				var kings = $(".dc>."+type+"_king");

				for (i = 0; i < kings.length; ++i) {
					var id = '#' + $(kings[i]).parent().attr('id');
					var ctype = $(id).children().attr('class');

					var col = +ch_to_int[id[1]];
					var row = +id[2];

					['tl', 'tr', 'bl', 'br'].forEach(function(it){check_diagonal(b_solution, s_solution, row, col, it, ctype[0], id);});
				}
				if (b_solution && b_solution.length != 0) {
					mandatory_beat = b_solution;
				}
			}
			
			start_step = 0;
		} else {
			reset();
		}
	}
});

function is_transform_in_king(type, id) {
	if (type == "w_ch" && id[1] == 8) return true;
	else if (type == "b_ch" && id[1] == 1) return true;
	else return false;
}


$(".dc>.b_ch").click(function(){click_checker(this, false)});
$(".dc>.w_ch").click(function(){click_checker(this, true)});
$(".dc>.w_king").click(function(){click_checker(this, true)});
$(".dc>.b_king").click(function(){click_checker(this, false)});


function click_checker(el, who) {
	event.stopImmediatePropagation();
	if (start_step == 1) {
		reset();
		return;
	}

	if (walketh != who) return;

	var id = $(el).parent().attr('id');

	var permission = false;
	for (var i = 0; i < mandatory_beat.length; ++i) {
		if (mandatory_beat[i].indexOf('#'+id) == 2) {
			permission = true;
			break;
		}
	}

	if (mandatory_beat.length == 0) permission = true;

	var res = false;
	if (permission) res = find_solution(id);
	else {
		show_help();
	}

	if (res != false) {
		sel_cell = "#" + id;
		start_step = 1;
		Solution = res;
		$(el).parent().addClass("dc_checked");
	}
}


function check_diagonal(b_solution, s_solution, row, col, direction, ct, from, orto) {
	var col_ofs = {'r': 1, 'l': -1};
	var row_ofs = {'w': {'t': 1, 'b': -1}, 'b': {'t': -1, 'b': 1}};

	var _row = row + row_ofs[ct][direction[0]];
	var _col = col + col_ofs[direction[1]];
	var _b_solution = [];

	var check_on_beat = false;
	while (_row > 0 && _row <= 8 && _col > 0 && _col <= 8) {
		var id = "#" + int_to_ch[_col] + _row;

		if (!$(id)[0].innerHTML) {
			if (check_on_beat) {
				if (orto) return true;
				_b_solution.push([id, ch_id, from]);
			}
			else s_solution.push(id);	
		} else {
			if (check_on_beat) break;

			var sid = $(id).children().attr('class');
			if (ct[0] == sid[0]) break;
			else {
				var ch_id = id;
				check_on_beat = true;
			}
		}
		_row += row_ofs[ct][direction[0]];
		_col += col_ofs[direction[1]];
	}

	if (orto) return false;

	var count = 0;
	if (_b_solution.length != 0) {
		var dirs = ['tl', 'tr', 'bl', 'br'];
		var exclude = {'tl': 'br', 'tr': 'bl', 'br': 'tl', 'bl': 'tr'};

		for (j = 0; j < _b_solution.length; ++j) {
			var nid = _b_solution[j][0];

			var ncol = +ch_to_int[nid[1]];
			var nrow = +nid[2];

			var total = false;
			for (i = 0; i < dirs.length; ++i) {	
				if (dirs[i] != exclude[direction] && dirs[i] != direction) {
					var res = check_diagonal(b_solution, s_solution, nrow, ncol, dirs[i], ct, nid, true);
					total = total || res;
				}
			}

			if (!total) {
				count++;
			} else {
				b_solution.push([nid, ch_id, from]);
			}
		}

		if (count == _b_solution.length) {
			for (var i = _b_solution.length - 1; i >= 0; --i) {
				b_solution.unshift(_b_solution[i]);
			}
		}
	}
}

function check_square(col, row, b_solution, s_solution, direction, ct, from) {
	var col_ofs = {'l': -1, 'r': 1};
	var n_ofs = {'w': 1, 'b': -1};
	var p_ofs = {'w': -1, 'b': 1};

	col += col_ofs[direction];
	var n_row = row + n_ofs[ct[0]];
	var p_row = row + p_ofs[ct[0]];

	if (col > 0 && col <= 8) {

		if (n_row > 0 && n_row <= 8) {
			var id = '#' + int_to_ch[col] + n_row;
			var child = $(id).children().attr('class');

			if (child && ct[0] != child[0]) { /* check if can beat */
				var _col = col + col_ofs[direction];
				var _row = n_row + n_ofs[ct[0]];

				if (_col > 0 && _col <= 8 && _row > 0 && _row <= 8) {
					var bid = '#' + int_to_ch[_col] + _row;
					if (!$(bid)[0].innerHTML) b_solution.push([bid, id, from]);
				}
			} else if (ct == child) {
				/* skip, the same color */
			} else { /* empty cell */
				if (!$(id)[0].innerHTML) s_solution.push(id);
			}
		}

		if (p_row > 0 && p_row <= 8) {
			var id = '#' + int_to_ch[col] + p_row;
			var child = $(id).children().attr('class');

			if (child && ct[0] != child[0]) {
				var _col = col + col_ofs[direction];
				var _row = p_row + p_ofs[ct[0]];

				if (_col > 0 && _col <= 8 && _row > 0 && _row <= 8) {
					var bid = '#' + int_to_ch[_col] + _row;
					if (!$(bid)[0].innerHTML) b_solution.push([bid, id, from]);
				}
			}
		}
	}
}


function find_solution(cell_id) {
	var row = +cell_id[1];
	var col = ch_to_int[cell_id[0]];
	var ct = $("#"+cell_id).children().attr('class');

	var s_solution = [];
	var b_solution = [];

	if (ct[2] == 'c') {
		['l', 'r'].forEach(function(it){check_square(col, row, b_solution, s_solution, it, ct);});
	} else {
		['tl', 'tr', 'bl', 'br'].forEach(function(it){check_diagonal(b_solution, s_solution, row, col, it, ct[0]);});
	}

	if (b_solution.length != 0) {
		b_solution.forEach(function(it){
			$(it[0]).addClass("dc_possible");
		});
		b_solution.unshift("beat");
	} else if (s_solution.length != 0) {
		s_solution.forEach(function(it){
			$(it).addClass("dc_possible");
		});
		s_solution.unshift("step");
	}

	if (s_solution.length == 0 && b_solution.length == 0) return false;
	else return (b_solution.length == 0) ? s_solution : b_solution;
}


function update_result () {
	if (beaten[0] > 0) {
		$("#b_beat").removeClass('hide');
		$("#b_count")[0].innerHTML = 'X ' + beaten[0];
	}

	if (beaten[1] > 0) {
		$("#w_beat").removeClass('hide');
		$("#w_count")[0].innerHTML = 'X ' + beaten[1];
	}
}

function send_msg() {
	var name = "Dima";
	var text = $("textarea.message").val();
	
	if (text == "\n") {
		$("textarea.message").val("");
		return;
	}
	if (text) {
		var history = $("textarea.history").val();
		$("textarea.history").val(history + "\n" + "[" + name + "]: " + text);
	}
	$("textarea.message").val("");
}


function timer()
{
  var t = d.data('timer');
  var result = Math.floor(t / 60);
  if(result < 10)
    result = '0' + result;
  result += ':';

  var seconds = t % 60;
  if(seconds < 10)
    seconds = '0' + seconds;

  result += seconds;

  $('div.timer').text(result);

  d.data('timer', ((t * 1) + 1));

  setTimeout('timer()', 1000);
}

function process(event) {
	/* press Enter */
	if (event.which == 13) {
		send_msg();
	}
}
