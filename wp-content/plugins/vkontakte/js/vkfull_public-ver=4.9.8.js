function saveVKCom(num,last_comment,date) {
jQuery(document).ready(function() {
	var data = {
		action: 'vkfull_comments_change',
		num: num,
		last_comment: last_comment,
		date: date,
		page_id: jQuery('#vk_comments').attr('page_id')
	};

	jQuery.post(jQuery('#vkfull_js_data').attr('admin_url')+'/admin-ajax.php', data, function() {});
});
}

function vkfullLike(num) {
	jQuery(document).ready(function() {
		var data = {
			action: 'vkfull_like_change',
			num: num,
			page_id: jQuery('#vk_like').attr('page_id')
		};
		jQuery.post(jQuery('#vkfull_js_data').attr('admin_url')+'/admin-ajax.php', data, function() {});
	});
}

VK.Observer.subscribe('widgets.like.liked', vkfullLike);
VK.Observer.subscribe('widgets.like.unliked', vkfullLike);