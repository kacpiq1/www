const fadeOut = () => {
const loaderWrapper = 
document.querySelecter('.wrapper');
loaderWrapper.classList.add('fade');
}

window.addEventListener('load', fadeOut);