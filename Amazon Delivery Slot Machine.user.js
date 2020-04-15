// ==UserScript==
// @name         Amazon Delivery Slot Machine
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  Automate checking for an available delivery slot on amazon. Mostly just refreshes and then beeps when found. Should handle re-login as well. Needs more testing.
// @author       Charlie Huckel
// @match        https://www.amazon.com/*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @run-at       document-idle
/* globals       $ */

// ==/UserScript==

(function() {
    'use strict';
    const config = {
        audio: 'https://github.com/chahu/amazon-slot-machine/raw/master/coin.mp3',
        color: '#e47911',
        elem: 'h5',
        minRefresh: 30,
        maxRefresh: 70, // refreshing between 30 to 70 seconds should [hopefully] be considered benign
    };
    let player;

    function beep(forever, appendToElem) {
        if (!player) { // Lazy load only when needed
            player = document.createElement('audio');
            player.src = config.audio;
            player.preload = 'auto';
        }
        if (forever) {
            let timer = setInterval(function() { player.play(); }, 1000);
            if (appendToElem) {
                $('<p><button>Stop Alarm</button></p>').click(function(event) {
		    event.stopPropagation();
		    clearInterval(timer);
		}).appendTo(appendToElem);
            }
        }
        else {
            player.play();
        }
    }

    // Repeat some function with exponential backof (2x) starting at min seconds, stopping when above max
    function timerBackoff(f, min=2, max=32) {
        if (min <= max) {
            setTimeout(() => { f(); timerBackoff(f, min * 2, max) }, min * 1000);
        }
    }

    function logger(msg, appendToElem) {
        let now = new Date();
        console.log("[" + now.toLocaleString() + "] " + msg);
        if (appendToElem) {
            try {
                $(`<${config.elem} style="color:${config.color}">[${now.toLocaleString()}] ${msg}</${config.elem}>`).appendTo(appendToElem);
            }
            catch (e) { }
        }
    }

    function clearAll() {
        for (let key of GM_listValues()) {
            GM_deleteValue(key);
            logger(`Deleting saved value "${key}"`);
        }
    }

    function isRunning() {
        let lastRefresh = GM_getValue('last_refresh', 0);
        let now = new Date().getTime();
        return (now - lastRefresh) < ((config.maxRefresh + 60) * 1000); // Just guess based on how recent the last refresh was
    }

    function handleLogin() {
        let $email = $('#ap_email');
        let $pass = $('#ap_password');
        // Email sign-in
        if ($email && $email.is(":visible") && GM_getValue('login','').length > 0) {
            $email.val(GM_getValue('login'));
            $('#continue').click();
            logger('Entered login to sign in');
        }
        // Password sign-in
        if($pass && $pass.is(":visible") && GM_getValue('password','').length > 0) {
            $pass.val(GM_getValue('password'));
            $('#signInSubmit').click();
            logger('Entered password to sign in');
        }
    }

    function reserveTime() {
        let container = $('#ss-migration-banner-DELIVERY div')[0] || $('div.a-alert-container h4.a-alert-heading:visible').parent()[0];
        let available = 0;
        // Whole Foods:
        available += $('div.ufss-slot-price-container span.ufss-slot-price-text:contains("$")').length;
        // Amazon Fresh
        available += $('div.ServiceType-slot-container span').filter(function() { return ! $(this).text().match(/^\s*No \w+ delivery windows/); }).length;

        if (available > 0) {
            if (isRunning()) {
                beep(true, container);
                logger(`AVAILABLE DELIVERY SLOT(S) FOUND!`, container);
                clearAll();
            }
        }
        else {
            let now = new Date();
            let seconds = Math.floor(Math.random() * (config.maxRefresh - config.minRefresh + 1)) + config.minRefresh;
            let iteration = 1;
            if (isRunning()) {
                iteration += GM_getValue('iteration', 0);
                setTimeout(function(){ location.reload(); }, seconds * 1000);
                GM_setValue('last_refresh', now.getTime());
                GM_setValue('iteration', iteration);
                var runningTime = Math.floor((now.getTime() - GM_getValue('first_refresh')) / 60000);
                logger(`Reloading in ${seconds} seconds, running for ${runningTime} ${runningTime === 1 ? "minute" : "minutes"}, iteration #${iteration}`, container);
                $('<input type="button" value="Cancel Automated Check" style="margin: 10px 0" />')
                    .appendTo(container)
                    .click(function() {
                    clearAll();
                    location.reload();
                    logger('Canceled by user');
                });
            }
            else {
                let tmpContainer = $('<div/>').appendTo(container);
                $(`<${config.elem} style="color:${config.color}">Would you like to automate checking for a delivery slot? An alarm will sound when found and you will need to complete the process yourself at that point. Keep your speakers on. Also after an hour or two you will likely be logged out, please enter your login/pass if you would like to be logged back in and the automation to continue at that point (optional). Your credentials will be temporarily stored locally.</${config.elem}>`)
                    .appendTo(tmpContainer);
                $(`<${config.elem} style="color:${config.color};margin: 10px 0;line-height: 30px;">Login: <input type="text" id="automation_login" style="position: absolute; left: 150px" /></${config.elem}>`)
                    .appendTo(tmpContainer);
                $(`<${config.elem} style="color:${config.color};margin: 10px 0;line-height: 30px;">Password: <input type="password" id="automation_pass" style="position: absolute; left: 150px" /></${config.elem}>`)
                    .appendTo(tmpContainer);
                $('<input type="button" value="Start Automated Check" style="margin: 10px 0" />')
                    .appendTo(tmpContainer)
                    .click(function() {
                    beep();
                    GM_setValue('login', $('#automation_login').val());
                    GM_setValue('password', $('#automation_pass').val());
                    GM_setValue('first_refresh', now.getTime());
                    GM_setValue('last_refresh', now.getTime());
                    GM_setValue('iteration', 0);
                    tmpContainer.remove();
                    reserveTime();
                });
            }
        }
    }

    // Schedule your order
    if (document.title.match('Reserve a Time Slot')) {
        reserveTime();
    }
    // The stuff below should only be done if we think we are currently trying to automate checkout
    else if (!isRunning()) {
        clearAll(); // Don't store anything if we're not running, in particular login/pass
        return;
    }
    // On sign in page
    else if (document.title.match("Sign-In")) {
        handleLogin();
    }
    // On Before you checkout page (asking you to buy more stuff)
    else if (document.title.match("Before you checkout")) {
        // Page isn't immediately ready for the click(), so delay the click (and keep trying)
        timerBackoff(() => { $('#a-autoid-0 a')[0].click(); logger(`Continue on "${document.title}" page`);});
    }
    // On Substitution page (whole foods)
    else if ($('#subsContinueButton input.a-button-input[type="submit"]').length) {
        // Page isn't immediately ready for the click(), so delay the click (and keep trying)
        timerBackoff(() => {$('#subsContinueButton-announce').click(); logger(`Continue on "${document.title}" page`);});
    }
    // On Change Quantities / Out of Stock page
    else if (document.title.match("Edit Quantities")) {
        timerBackoff(() => {$('input.a-button-text[value="Continue"]').click(); logger(`Continue on "${document.title}" page`);});
    }
    // On Shopping Cart page
    else if (document.title.match("Shopping Cart")) {
        $('#gutterCartViewForm input.a-button-input[value="Proceed to checkout"]').first().click();
        logger('Checking out');
    }
    // Not on shopping cart page, but maybe we should be
    else if ($('#nav-cart-count').length && parseInt($('#nav-cart-count').text()) > 0) {
        $('#nav-cart-count').click();
        logger('Going to Shopping Cart');
    }

})();
