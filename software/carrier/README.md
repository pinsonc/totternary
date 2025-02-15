nRF BLE Code
============

The software in this folder runs on the nRF52840 BLE chip. Look in the `/apps`
folder for the software that runs on the different hardware platforms:

- `blink`: Simply blinks an LED to verify that the board is working correctly (useful in combination with timers and for power testing).
- `node`: Standard application code for both initiators and responders; configures itself automatically for correct Glossy roles.
- `testing`: Application to run seperate hardware tests for BLE, accelerometer, SD card, timers and other individual functionality.

We leverage the `nrf5x-base` repository for some helper code and
build files. Make sure that you check out the correct, active branch.

Remote debugging
----------------

**Attention:** Before debugging, don't forget to run `make debug -B` first to create the debug symbol list (appends compiler flag `-g`).

*Note:* To improve the usefulness of step-by-step debugging, it is advised to disable compiler optimization for size,
as variables and registers can be optimized away; furthermore, source and binary code lines will not correspond anymore and will result in "jumping around".
To prevent this, add `CFLAGS += -Og` *and* delete the corresponding line in `/nrf5x-base/make/Makefile`. 

If you intend to use a remote debugging tool for step-by-step debugging (such as J-Link),
we suggest extending the `Makefile.posix` file in `nrf5x-base/make` with the following lines:

    remotedbg: debug-gdbinit
    	$(TERMINAL) "$(JLINKGDBSERVER) -port $(GDB_PORT_NUMBER)"

This will allow you to start a JLinkGDBServer on the remote device which you can then connect to from your host device.
This requires the following configurations for your GDB (usually directly in the *Debug* configs of your IDE):

- GDB: `arm-none-eabi-gdb`
- 'target remote' args: `:2331`
- Symbol file: `/nrf51822/apps/${app}/${app_name}.elf`

*Note*:  An alternative way to achieve the same goal without adapting the files manually is by running `make startdebug`
and then closing the GDB window using `quit`.