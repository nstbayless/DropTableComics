function searchSubmit(text){
  console.log("searching for '"+text+"'")
}

//called when the search form gets a keypress
function searchKeypress(e){
  if (e.which==13||e.which==10) {
    //user presses enter
    searchSubmit(document.getElementById("search").value);
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
