var courseName = localStorage.courseKey
var lectureName = localStorage.lectureKey
var lectureTitle = localStorage.lectureTitle

var tags = []
var questions = []
var name = ""

var config = {
    apiKey: "AIzaSyCxnL1UyMBU51tJU5MAKmCxHPAaMpb2veY",
    authDomain: "listen-f5fcf.firebaseapp.com",
    databaseURL: "https://listen-f5fcf.firebaseio.com",
    projectId: "listen-f5fcf",
    storageBucket: "listen-f5fcf.appspot.com",
    messagingSenderId: "913421957842"
};

firebase.initializeApp(config)
var database = firebase.database()
var courseRef = database.ref("courses/" + courseName)
var lectureRef = database.ref("courses/" + courseName + "/" + "lectures" + "/"+ lectureName)
var tagsRef = database.ref("courses/" + courseName + "/lectures/" + lectureName + "/tags")

var activeRef = database.ref("activeLecture")
activeRef.set(null)
activeRef.push({course: courseName, lecture: lectureName})

$(document).ready(function(){
	console.log($.now())
	$("#course-name").html(courseName)
	$("#lec-name").html(lectureName)
	$("#lec-title").html(lectureTitle)
	$(".question-list").on("click", ".q-txt", function(){
		var info = $(this).data("info").split(",")
		var index = info[0]
		var id = info[1]
		var tag = info[2]
		if(!$("#q-" + index).data("answered")){
			$("#q-" + index).animate({'opacity': 0}, 100, function(){
				var del_btn = $(this).children().last();
				del_btn.html("");
				del_btn.removeClass("q-del-btn").addClass("q-answered-del");
				var text = $(this).children().first();
				text.html("Answered").addClass("q-answered-txt").css({"text-align": "center", "border-width": "1px 0px 1px 1px"});
				$(this).animate({'opacity': 1}, 100).delay(300);

				questions[index].answered = true;

				$(this).fadeOut(200, function(){
					$(this).remove()
					tagsRef.child(tag + "/" + id + "/answered").set(true)
				})
			})
		}
	})

	$(".question-list").on("click", ".q-del-btn", function(){
		$("#q-" + $(this).data("id")).fadeOut(200, function(){
			var info = $(this).find(".q-txt").data("info").split(",")
			var index = info[0]
			var id = info[1]
			var tag = info[2]
			$(this).remove();
			questions.splice(index, 1);
			tagsRef.child(tag + "/" + id).remove()
		});
	})

	$(".show-more-btn").on("click", function(){
		if($(this).data("expanded")){
			$(this).data("expanded", false);
			$(this).html("Show More")
		}else{
			$(this).data("expanded", true);
			$(this).html("Show Less")
		}
		printQuestions();
	})

	$("#tag-list").on("click", ".tag-entry", function(){
		if($(this).hasClass("selected-tag")){
			name = ""
			printQuestions()
			$(this).removeClass("selected-tag")
		}else{
			$("#tag-list").find(".selected-tag").removeClass("selected-tag")
			name = $(this).data("name")
			printQuestions()
			$(this).addClass("selected-tag")
		}
	})

	$("#end-btn").on("click", function(){
		if(confirm("Do you really want to end the lecture?")){
			activeRef.set(null)
			document.location.href = './lectures_list_page.html'
		}
	})
})

lectureRef.on("value", function(snap){
	var snapshot = snap.child("tags")
	var totalNumQs = 0
	questions = []
	tags = []
	snapshot.forEach(function(childSnap){
		var tag = childSnap.key
		var ques_list = childSnap.val()
		var numQs = 0
		for (var i = 0; i < ques_list.length; i++){
			var question = ques_list[i]
			if(question){
				question.tag = tag
				question.id = i
				questions.push(question)
				numQs++
			}
		}
		tags.push({tagName: tag, numQs: numQs})
		totalNumQs += numQs
	})
	lectureRef.update({totalQuestions: totalNumQs})
	printQuestions()
	printTags()
})

function sortQuestions(){
	questions.sort(timeCompare)
	questions.sort(answeredCompare)
}

function timeCompare(a, b){
	return a.time - b.time
}

function answeredCompare(a, b){
	if((a.answered && b.answered) || (!a.answered && !b.answered)){
		return 0
	}else if(a.answered && !b.answered){
		return 1
	}else{
		return -1
	}
}

function tagsCompare(a, b){
	return b.numQs - a.numQs
}

function printQuestions(){
	$(".question-list").empty();
	sortQuestions()
	if(!$(".show-more-btn").data("expanded")){
		var i = 0
		var printed = 0
		while(printed < 5 && i < questions.length){
			printed += printQ(i)
			i++
		}
	}else{
		for(var i = 0; i < questions.length; i++)
			printQ(i)
	}

	if(questions.length < 6)
		$(".show-more-btn").css("visibility", "hidden");
	else
		$(".show-more-btn").css("visibility", "visible");
}

function printQ(i){
	if(!name || questions[i].tag == name){
		if(!questions[i].answered){
			$(".question-list").append(`<tr class="question-entry" id="q-${i}">
				<td class="q-txt" data-info="${i},${questions[i].id},${questions[i].tag}">
				<p class="q-details"> <span style="color:#337ab7">#${questions[i].tag}</span> 
				Time: ${formatTime(questions[i].time)}</p>${questions[i].text}</td>
				<td class="q-del-btn" data-id="${i}">&#10006;</td></tr>`);
		}else{
			$(".question-list").append(`<tr class="question-entry" id="q-${i}" data-answered="true">
				<td class="q-txt q-answered-txt q-understand" data-info="${i},${questions[i].id},${questions[i].tag}">
				<p class="q-details" style="color: #efefef"> #${questions[i].tag}
				Time: ${formatTime(questions[i].time)}</p>${questions[i].text}</td>
				<td class="q-del-btn" data-id="${i}">&#10006;</td></tr>`);
		}
		return 1
	}
	return 0
}


function printTags(){
	$("#tag-list").empty()
	tags.sort(tagsCompare)
	tags.forEach(function(tag){
		$("#tag-list").append(`<h5 class="tag-entry" data-name="${tag.tagName}"><a>#${tag.tagName}</a> <span style="color: orange">(${tag.numQs})</span></h5>`)
	})
}

function formatTime(millis) {
	var totalSecElapsed = ((Math.floor(millis / 1000)  + 9*3600) % 86400);
	var minutes = Math.floor(totalSecElapsed / 60) % 60;
	var hours = Math.floor(totalSecElapsed / 3600);
	var AMorPM = (hours > 11 ? " PM" : " AM")
	hours = (hours%12 == 0 ? 12 : hours % 12)

	return (hours < 10 ? "0" : "") + hours + (minutes < 10 ? ":0" : ":")
	  + minutes + AMorPM
}