function pad(value) {
    if(value < 10) {
        return '0' + value;
    } else {
        return value;
    }
}

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
