/*!
 * BC DevX v0.1.0 ()
 * Copyright 2016-2016 Stephen Richter <stephenrichter15@gmail.com>
 * Licensed under MIT (https://github.com/BCDevExchange/design)
 */
!function(t){"use strict";t("a.page-scroll").bind("click",function(o){var e=t(this);console.log(e),t("html, body").stop().animate({scrollTop:t(e.attr("href")).offset().top-50},1250,"easeInOutExpo"),o.preventDefault()}),t("body").scrollspy({target:".navbar-fixed-top",offset:100}),t("#mainNav").affix({offset:{top:50}})}(jQuery);