function searchSubmit(){
  var text = document.getElementById("search").value;
  window.location.href="/pretty/search/"+text;
}

//called when the search form gets a keypress
function searchKeypress(e){
  if (e.which==13||e.which==10) {
    //user presses enter
    searchSubmit();
  }
}

//indicates user hasn't focussed on form yet
var firstfocus=true;
//called when the search form gets focussed
function searchFocusClear(){
  if (firstfocus){
    var searchform=document.getElementById("search");
    searchform.value="";
    firstfocus=false;
  }
}

function viewlistSubmit(){
  winow.location.href="*/adminpage";
}