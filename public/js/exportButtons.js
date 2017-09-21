var exportBtn = document.querySelector('.export-button')
var exportIcon = document.querySelector('.export-icon')
var exportPattern = document.querySelector('.export-pattern')
var iconOutput = document.getElementById('iconOutput')
var patternOutput = document.getElementById('patternOutput')

exportBtn.addEventListener('click', onExport, false)
exportIcon.addEventListener('click', onExportIcon, false)
exportPattern.addEventListener('click', onExportPattern, false)

function onExport (e) {
  e.preventDefault
  patternOpen()
  iconOpen()
}

function onExportIcon (e) {
  e.preventDefault
  iconOpen()
}

function onExportPattern (e) {
  e.preventDefault
  patternOpen()
}

function patternOpen () {
  window.open('data:image/svg+xml;utf8,' + iconOutput.innerHTML, '_blank')
}
function iconOpen () {
  window.open('data:image/svg+xml;utf8,' + patternOutput.innerHTML, '_blank')
}
