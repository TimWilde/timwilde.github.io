var settings = { profiles: [] },
	 profile,
	 validation,
	 details = { rows: [] };

(function($){
	
	$(function(){
		if(typeof(Storage) === 'undefined') {
			alert('Local storage not supported.');
			return;
		}

		validation = $('#edit-profile-form').validate({
			valid: saveProfile,
			sendForm: false
		});

		if(hasConfiguredProfiles()) {
			loadSettings();
			selectProfile(true);
		} else
			configureProfiles();

		$('.select-profile').on('click', populateProfileModal);
		$('.edit-profile').on('click', editProfile);
		$('.create-profile').on('click', resetEditProfileForm);
		$('#edit-profile-form').on('submit', editProfile);
		$('form#select-profile-form').on('submit', switchProfile);
		$('#add-task').on('submit', addTask);
		$('#select-profile-modal').modal({backdrop: 'static', show: false, modalOverflow: true});
		$('#edit-profile-modal').modal({backdrop: 'static', show: false, modalOverflow: true});
		$(document).on('click', 'a.delete', removeRow);
		$(document).on('change', 'table#estimates tbody select', true, recalculate);
		$('.sortable').sortable();
	});

	var removeRow = function(){
		$(this).closest('tr').remove();
		recalculate(true);
	};

	var recalculate = function(save){
		var rows = $('#estimates tbody tr');
		var totalTime = 0.0, totalCost = 0.0;

		if(save)
			details = { rows: [] };

		$.each(rows, function(i,v){
			var row = $(v);
			var desc = row.find('.description span').text();
			var s = row.find('select[name=size] :selected').val();
			var c = row.find('select[name=complexity] :selected').val();

			var time = row.find('.time');
			var cost = row.find('.cost');

			var rowTime = profile.size[s] * profile.complexity[c];
			var rowCost = profile.rate * rowTime;

			totalTime += rowTime;
			totalCost += rowCost;

			time.text(rowTime.toFixed(2));
			cost.html(profile.currency + rowCost.toFixed(2));

			if(save)
				details.rows.push({description: desc, size: s, complexity: c});
		});

		$('#total-time').text(totalTime.toFixed(2));
		$('#total-cost').html(profile.currency + totalCost.toFixed(2));

		if(save)
			saveDetails();
	};

	var addTask = function(e){
		var form = $(this);
		var estimates = $('table#estimates tbody');

		var descriptionField = form.find('[name=description]');
		var description = descriptionField.val();
		
		estimates.append(buildRow(description, '', ''));
		recalculate(true);

		form[0].reset();
		descriptionField.focus();
		e.preventDefault();
	};

	var buildRow = function(d, s, c){
		var row = $('<tr></tr>');

		row.append('<td class="description"><a href="#" class="btn btn-danger btn-mini delete"><i class="icon-remove icon-white"></i> Remove</a><span>' + d + '</span></td>');
		row.append(selectSize(s));
		row.append(selectComplexity(c));
		row.append('<td class="time center"></td>');
		row.append('<td class="cost right"></td>');

		return row;
	};

	var selectSize = function(size){
		var select = $('<select name="size" class="input-small"></select>');
		select.append('<option value="small">Small</option>');
		select.append('<option value="medium">Medium</option>');
		select.append('<option value="large">Large</option>');

		if(size)
			select.val(size);

		return $('<td class="center"></td>').append(select);
	};

	var selectComplexity = function(complexity){
		var select = $('<select name="complexity" class="input-small"></select>');
		select.append('<option value="low">Low</option>');
		select.append('<option value="medium">Medium</option>');
		select.append('<option value="high">High</option>');

		if(complexity)
			select.val(complexity);

		return $('<td class="center"></td>').append(select);
	};

	var resetEditProfileForm = function(){
		var form = $('#edit-profile-form');
		form[0].reset();
	};

	var populateProfileModal = function(reload){
		$('#select-profile-modal .alert').addClass('hide');
		var profileList = $('#select-profile-form ul.profiles');
		profileList.empty();

		for(var profileIndex in settings.profiles){
			var profile = settings.profiles[profileIndex];
			profileList.append('<li><label class="radio"><input type="radio" name="profile" value="' + profileIndex + '" />' + profile.name + ': ' + profile.currency + profile.rate.toFixed(2) + ' per ' + profile.unit.toLowerCase() + '</label></li>');
		}
	};

	var saveSettings = function(){
		localStorage.settings = JSON.stringify(settings);
	};

	var saveDetails = function(){
		localStorage.details = JSON.stringify(details);
	};

	var loadSettings = function(){
		if(localStorage.settings) {
			settings = JSON.parse(localStorage.settings);
		} else {
			settings = { profiles: [] };
		}

		if(localStorage.details) {
			details = JSON.parse(localStorage.details);
		} else {
			details = {rows:[]};
		}
	};

	var rebuildDetails = function(){
		var estimates = $('table#estimates tbody');
		if(estimates.find('tr').length > 0) return;

		for(var r in details.rows){
			var row = details.rows[r];
			estimates.append(buildRow(row.description, row.size, row.complexity));
		}

		recalculate();
	};

	var hasConfiguredProfiles = function(){
		return localStorage.settings;
	};

	var configureProfiles = function(){
		$('.create-profile').click();
	};

	var selectProfile = function(reload){
		populateProfileModal(reload);
		$('#select-profile-modal').modal({show: true, backdrop: 'static', modalOverflow: true});
	};

	var switchProfile = function(e){
		var selected = $('input[name=profile]:checked').val();
		profile = settings.profiles[selected];
		if(profile){
			updateDetailsFromProfile();
			rebuildDetails();
			$('#select-profile-modal').modal('hide');
		} else {
			$('#select-profile-modal .alert-warning').removeClass('hide');
		}
		return false;
	};

	var updateDetailsFromProfile = function(){
		var settings = $('#settings');

		$('.unit').text(profile.unit);
		$('.unit.lower').text(profile.unit.toLowerCase());

		settings.find('li.profile span.value').text(profile.name);
		settings.find('li.rate span.value').html(profile.currency + profile.rate.toFixed(2));

		settings.find('ol.size li.small span.value').text(profile.size.small.toFixed(2));
		settings.find('ol.size li.medium span.value').text(profile.size.medium.toFixed(2));
		settings.find('ol.size li.large span.value').text(profile.size.large.toFixed(2));

		settings.find('ol.complexity li.low span.value').text(profile.complexity.low.toFixed(2));
		settings.find('ol.complexity li.medium span.value').text(profile.complexity.medium.toFixed(2));
		settings.find('ol.complexity li.high span.value').text(profile.complexity.high.toFixed(2));

		recalculate();
	};

	var editProfile = function(e){
		var profileForm = $('#edit-profile-form');

		if(profile){
			profileForm.find('#name').val(profile.name);
			profileForm.find('#rate').val(profile.rate);
			profileForm.find('#small').val(profile.size.small);
			profileForm.find('#medium').val(profile.size.medium);
			profileForm.find('#large').val(profile.size.large);
			profileForm.find('#low').val(profile.complexity.low);
			profileForm.find('#medium-complexity').val(profile.complexity.medium);
			profileForm.find('#high').val(profile.complexity.high);
			profileForm.find('[name=editing]').val(profile.id);
		}
	};

	var saveProfile = function(){
		var profileForm = $('#edit-profile-form');
		var id = profileForm.find('[name=editing]').val();
		
		var localProfile = {
			size: {},
			complexity: {}
		};

		localProfile.name = profileForm.find('#name').val();
		localProfile.currency = '&pound;';
		localProfile.rate = parseFloat(profileForm.find('#rate').val());
		localProfile.unit = profileForm.find('#unit :selected').val();
		localProfile.size.small = parseFloat(profileForm.find('#small').val());
		localProfile.size.medium = parseFloat(profileForm.find('#medium').val());
		localProfile.size.large = parseFloat(profileForm.find('#large').val());
		localProfile.complexity.low = parseFloat(profileForm.find('#low').val());
		localProfile.complexity.medium = parseFloat(profileForm.find('#medium-complexity').val());
		localProfile.complexity.high = parseFloat(profileForm.find('#high').val());
		localProfile.id = new Date().getTime();

		if(id == '')
			settings.profiles.push(localProfile);
		else{
			var index = -1;
			for(i in settings.profiles){
				var p = settings.profiles[i];
				if(p.id == id) {
					index = i;
					break;
				}
			}

			if(index > -1)
				settings.profiles[index] = localProfile;
			else
				settings.profiles.push(localProfile);
		}

		saveSettings();

		profile = localProfile;
		updateDetailsFromProfile();

		$('#edit-profile-modal').modal('hide');

		return false;
	};
})(jQuery);