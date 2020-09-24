// Saves options to chrome.storage
function save_options() {
  var portrait = document.getElementById('portrait').checked;
  var english  = document.getElementById('english').checked;
  var french   = document.getElementById('french').checked;
  var german   = document.getElementById('german').checked;
  var japanese = document.getElementById('japanese').checked;
  var pokindex = document.getElementById('pokindex').checked;
  
  chrome.storage.sync.set({
	portrait: 	portrait,
	english: 	english,
	french: 	french,
	german: 	german,
	japanese:	japanese,
	pokindex: 	pokindex
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    portrait: 	true,
	english: 	true,
	french: 	true,
	german: 	false,
	japanese:	false,
	pokindex: 	true
  }, function(items) {
	document.getElementById('portrait').checked = items.portrait;
	document.getElementById('english').checked = items.english;
	document.getElementById('french').checked = items.french;
	document.getElementById('german').checked = items.german;
	document.getElementById('japanese').checked = items.japanese;
	document.getElementById('pokindex').checked = items.pokindex;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);