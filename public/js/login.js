let height = window.innerHeight;
let loginForm = document.querySelector('form');
let loginFormHeight = document.querySelector("form").offsetHeight;
let winWidth = window.innerWidth;
let availHeight = window.innerHeight - loginFormHeight;

// Calculate available screen space
let calcAvailHeight = function(winH, elemH) {
  if(winH <= elemH) {
    return 0;
  } else {
    return Math.round((winH - elemH) / 2);
  }
}

// Set min-
// Set initial position for form
let availHeightAmount = calcAvailHeight(height, loginFormHeight);
if(availHeightAmount <= 0 || winWidth <= 767) {
  loginForm.style.marginTop = '100px';
} else {
  loginForm.style.marginTop = `${availHeightAmount - 50}px`;
}


// Set register window to half the window height on resize
window.addEventListener('resize', function() {
  // Set new window height
  height = window.innerHeight;
  winWidth = window.innerWidth;
  // Calculate new available height
  availHeightAmount = calcAvailHeight(height, loginFormHeight);
  // Set initial position for form
  if(availHeightAmount <= 0 || winWidth <= 767) {
    loginForm.style.marginTop = '100px';
  } else {
    loginForm.style.marginTop = `${availHeightAmount}px`;
  }
});