let height = window.innerHeight;
let registerForm = document.querySelector('form');
let registerFormHeight = document.querySelector("form").offsetHeight;
let winWidth = window.innerWidth;
let availHeight = window.innerHeight - registerFormHeight;

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
let availHeightAmount = calcAvailHeight(height, registerFormHeight);
if(availHeightAmount <= 0 || winWidth <= 767) {
  registerForm.style.marginTop = '100px';
} else {
  registerForm.style.marginTop = `${availHeightAmount - 50}px`;
}


// Set register window to half the window height on resize
window.addEventListener('resize', function() {
  // Set new window height
  height = window.innerHeight;
  // Calculate new available height
  availHeightAmount = calcAvailHeight(height, registerFormHeight);
  // Set initial position for form
  if(availHeightAmount <= 0 || winWidth <= 767) {
    registerForm.style.marginTop = '100px';
  } else {
    registerForm.style.marginTop = `${availHeightAmount}px`;
  }
});