// ==UserScript==
// @name         Amazon Delivery Slot Machine
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Automate reserving an Amazon Fresh or Whole Foods delivery time slot. This works by refreshing until an available delivery time slot is available and then sounds an alarm when found. Can handle re-login as well. Cross platform support.
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
        maxRefresh: 70, // 30 to 70 seconds refresh should [hopefully] be considered benign
    };
    let player;

    function beep(forever) {
        if (!player) { // Lazy load only when needed
            player = document.createElement('audio');
            player.src = config.audio;
            player.preload = 'auto';
        }
        if (forever) {
            let timer = setInterval(function() { player.play(); }, 1000);
            // Stop playing alarm if user clicks anywhere
            $(document.body).click(() => clearInterval(timer));
        }
        else {
            player.play();
        }
    }

    // Repeat function with (2x) exponential backof from min seconds to <= max
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
                $(`<${config.elem} style="color:${config.color}">[${now.toLocaleString()}] ${msg}</${config.elem}>`)
                    .appendTo(appendToElem);
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
        // Just guess based on how recent the last refresh was
        return (now - lastRefresh) < ((config.maxRefresh + 120) * 1000);
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
        let container = $('#ss-migration-banner-DELIVERY div')[0]
                     || $('div.a-alert-container h4.a-alert-heading:visible').parent()[0];
        let available = 0;
        // Whole Foods:
        available += $('div.ufss-slot-price-container span.ufss-slot-price-text:contains("$")').length;
        // Amazon Fresh
        available += $('div.ServiceType-slot-container span').filter(function() { return ! $(this).text().match(/^\s*No \w+ delivery windows/); }).length;

        if (available > 0) {
            if (isRunning()) {
                beep(true);
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

    /***************************************************************
     * Remaining logic checks current page and handles accordingly *
     ***************************************************************/

    // Schedule your order
    if (document.title.match('Reserve a Time Slot')) {
        reserveTime();
    }
    else if (!isRunning()) {
        clearAll(); // Don't store anything (e.g. login/pass)
        return;
    }

    /***************************************************************
     * Below only executes when currently searching for time slots *
     ***************************************************************/

    // On sign in page
    else if (document.title.match("Sign-In")) {
        handleLogin();
    }
    // On Before you checkout page (asking you to buy more stuff)
    else if (document.title.match("Before you checkout")) {
        timerBackoff(() => {
            $('#a-autoid-0 a')[0].click();
            logger(`Continue on "${document.title}" page`);
        });
    }
    // On Substitution page (whole foods)
    else if ($('#subsContinueButton input.a-button-input[type="submit"]').length) {
        timerBackoff(() => {
            $('#subsContinueButton-announce').click();
            logger(`Continue on "${document.title}" page`);
        });
    }
    // On Change Quantities / Out of Stock page
    else if (document.title.match("Edit Quantities")) {
        timerBackoff(() => {
            $('input.a-button-text[value="Continue"]').click();
            logger(`Continue on "${document.title}" page`);
        });
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
