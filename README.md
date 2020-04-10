# amazon-slot-machine
Automate finding an available delivery slot for Amazon Fresh &amp; Whole Foods

### Installation
1. Install [Tampermonkey extension for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. [Click here](https://github.com/chahu/amazon-slot-machine/raw/master/Amazon%20Delivery%20Slot%20Machine.user.js) then install with Tampermonkey

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

- The process can be canceled by clicking "Cancel Automated Check" on the "Reserve a Time Slot". This is the main page which is refreshed.
- Status messages are also added to the "Reserve a Time Slot" page telling how long it has been running and how in how many seconds it will refresh.
- 

### Issues
- Testing, this has not been tested extensively.
- Submit Issues/Bugs to help improve this
