# amazon-slot-machine
Automated finding an available delivery slot for amazon fresh &amp; whole foods

### Installation
1. Install Tampermonkey extension for Chrome
2. Click here // TODO

### Notes

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

### Issues
- Testing, this has not been tested extensively.
