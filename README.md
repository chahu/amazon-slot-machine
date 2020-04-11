# amazon-slot-machine
Automate finding an available delivery slot for Amazon Fresh &amp; Whole Foods

### Installation
1. Install the [Tampermonkey extension](https://www.tampermonkey.net/). I've tested this on [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) but this should work across other browsers supported by Tampermonkey as well (Microsoft Edge, Safari, Opera Next, and Firefox).
2. [Click here](https://github.com/chahu/amazon-slot-machine/raw/master/Amazon%20Delivery%20Slot%20Machine.user.js), then install with Tampermonkey

### Overview

If you're having trouble ordering groceries on Amazon Fresh (or Whole Foods) on amazon.com, this may help.
When you try to check out and get to the page with no delivery slots available, if the script was installed
correctly and is working, you should see a message asking if you'd like to start the automated check for a
delivery slot.
At this point you have the option of entering your login and password. If you do not this will still work 
until amazon requires logging in again (2 hours from what I can tell). At that point you'll need to manually
start this again. When credentials are entered this code should continue running and relogin the user. In
either case click the start button to begin the automated process.

When one or more delivery slots are detected an alarm will sound repeatedly. At this point the user should 
quickly select an available slot and continue.

### Features

- Minimal requirements (a modern browser with Tampermonkey)
- Simple integration: To start you'll see this on the delivery slot page: ![Screenshot](images/start.png)
- Updated status message letting you know it is still running and some simple info: ![Screenshot](images/reload.png)
- Cancelling is also done with one click (above).
- When the process is started a single "coin" audio sound will play. This is the same sound that will play on repeat as an alarm later. Make sure you can hear this sound when you click start.
- Everything is local, no data is sent anywhere in connection with this code outside of the obvious interaction with amazon pages.
- The stored login & pass are only stored for the duration of the automated check process, afterwhich time they are deleted. Although they are only stored locally, if a malicous user has access to your computer they could conceivably gain access to this data. For that reason we do not store these credentials more an absolutely necessary. Additionally the user need not provide their credentials to get about two hours of automated checking from this code. 


### Issues
- Testing, this has not been tested extensively.
- Submit Issues/Bugs to help improve this
