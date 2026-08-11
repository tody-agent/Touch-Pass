# Use Touch Pass

Touch Pass is ready to use once the hardware and macOS helper have been set
up. This is the everyday guide: name your fingers, give them useful actions,
and keep each touch intentional. For hardware setup, start with the
[build guide](BUILD_GUIDE.md).

![A Touch Pass login action ready at a Mac](../assets/demo/03-login-success.png)

## Open the portal

1. Plug in the Touch Pass board and start the helper if it is not already
   running:

   ```bash
   .venv/bin/python software/macos-helper/tinytouch_helper.py
   ```

2. In a browser on that same Mac, open
   [http://127.0.0.1:8787](http://127.0.0.1:8787).
3. Check the status at the top of the page. You are ready when it says the
   ZW101 is ready and shows its USB port. If it says the ESP32-S3 is connected
   but the sensor is being checked, wait a moment; if it stays in that state,
   use **Troubleshooting** below.

The portal is local to your Mac. It is for configuring Touch Pass; it does not
need an internet connection and is not a page to share with another person.

## Your ten slots

The portal always shows ten numbered slots: 01 through 10. A slot is one
fingerprint template plus one named action. An empty slot says that no
fingerprint is enrolled; a configured slot shows its name and selected action.

Treat the slot number as a simple label, not a specific anatomical finger. For
example, slot 01 can be your right thumb today and a different finger after you
delete and enrol it again. Give each slot a short, clear name such as “Mac
login”, “Claude accept”, or “Terminal Enter” so you can recognise it later.

It is fine to configure an action before enrolling the finger. Begin with just
one harmless action, test it in a text editor, then add more slots gradually.

## Enroll

1. On the slot you want to use, select **Configure** (`Cấu hình`), give it a
   name, choose an action, and save.
2. Select **Enroll** (`Đăng ký`).
3. Follow the on-screen prompts: place that finger on the sensor, lift it when
   asked, then place the **same** finger a second time.
4. Wait for “Enrollment complete” (`Đăng ký hoàn tất`). The slot will then be
   marked enrolled.

Only one enrollment or deletion can run at a time. If you began the wrong one,
use **Cancel** (`Hủy`) in the progress window, wait until it reports cancelled,
and then start again. A failed enrollment does not make the action run; clean
the sensor surface, use a relaxed full touch, and retry.

## Choose an action

Open **Configure** for a slot, choose a preset, then save. These are keyboard
actions: Touch Pass sends the listed keys to the Mac’s currently focused field.

| Action | What Touch Pass sends | Good use |
| --- | --- | --- |
| **Password + Enter** | Your saved password, then Return | A login field that you have checked yourself |
| **Accept** | `y`, then Return | A prompt that visibly asks for `y` to continue |
| **Enter** | Return | Advance a selected dialog or submit a harmless form |
| **Escape** | Escape | Dismiss a dialog or cancel a command prompt |
| **Custom** | Your Text, Key, and Delay steps | A short, repeatable keyboard sequence |

### Password + Enter

Select **Password + Enter** (`Mật khẩu + Enter`) and enter the password the
first time you save the slot. Password actions accept only ASCII characters
(the common English/US characters), with a length of 1–128 characters. When
you open the slot again, leave the password box empty to keep the password
already stored; type a new value only when you mean to replace it.

Touch Pass sends this action with a single recognised touch. That is convenient
for a login screen, so always make sure the intended password field is focused
before touching the sensor.

### Accept, Enter, and Escape

Use **Accept** for a prompt where the expected response really is lowercase
`y` followed by Return. For example, a Codex or Claude workflow may show a
terminal or browser prompt that accepts `y`; Touch Pass does not know which app
or prompt is open, so read the prompt and focus it before you use the action.

**Enter** sends Return and **Escape** sends Escape. Both, like Accept, require
a confirming second touch; see the next section.

### Custom sequences

Choose **Custom macro** (`Macro tùy chỉnh`) to make a sequence of up to **16
steps**. Add only the steps you need:

- **Text** types ASCII text. Use plain ABC/US characters; accented or other
  non-ASCII characters are rejected.
- **Key** can be `enter`, `escape`, `tab`, `space`, `up`, `down`, `left`, or
  `right`.
- **Delay** pauses for 0–5000 milliseconds, which can give a visible dialog
  time to appear before the next key.

A practical sequence might be `Text: yes`, `Key: enter`; a navigation sequence
might be `Key: tab`, `Key: tab`, `Key: enter`. Keep macros short and test them
in a harmless document first. A custom sequence is a control action, so it
also needs the two-touch confirmation.

## One touch or double touch

Touch Pass deliberately treats passwords differently from control actions.

| You chose | How to run it |
| --- | --- |
| Password + Enter | Touch the enrolled finger once. |
| Accept, Enter, Escape, or Custom | Touch the **same enrolled finger twice within three seconds**. |

For a double-touch action, the first touch only arms that finger. Lift your
finger and touch it again within three seconds to send the action. Touching a
different finger, or waiting too long, arms the latest touch instead; it does
not run the previous action. When in doubt, pause and begin the two touches
again.

![A Touch Pass desk setup with a Claude acceptance prompt](../assets/demo/02-mac-mini-claude-accept-v2.png)

## Starter layouts

Start with actions whose result is easy to see and undo. These are examples,
not automatic integrations: each action always goes to whichever field has
focus on your Mac.

| Slot name | Suggested finger | Action | When it is useful |
| --- | --- | --- | --- |
| Mac login | Thumb | Password + Enter | The correct macOS or website password field is visibly selected. |
| Codex accept | Index finger | Accept | A visible Codex-related prompt expects `y` then Return. |
| Claude accept | Index finger on the other hand | Accept | A visible Claude-related prompt expects `y` then Return. |
| Terminal Enter | Middle finger | Enter | You have read the command and want to submit it. |
| Back out | Ring finger | Escape | A dialog or command prompt needs dismissal. |
| Test macro | Little finger | Custom: `Text: hello`, `Key: enter` | A scratch text document while learning. |

Do not copy a layout just because it looks convenient. In particular, only set
up a password for a service you are comfortable having typed through a USB HID
keyboard, and do not put a password into a custom Text step.

## Edit, replace, delete

Use **Configure** to rename a slot or replace its action. Save the new settings
before you test them. Replacing a password with Accept, Enter, Escape, or
Custom removes that slot’s old password from Keychain.

To change the fingerprint itself, select **Delete fingerprint** (`Xóa vân`) on
the enrolled slot and confirm the warning. The portal asks the sensor to erase
the fingerprint, then resets the slot to its default empty state and removes
any password saved for it. Configure the slot again and enrol the new finger.

If you only want to change the action—not the fingerprint—do not delete it.
Simply configure and save the existing slot. If a deletion or enrollment window
is still active, finish or cancel it before starting another administrative
task.

## Secrets and privacy

Password values are stored as separate items in the macOS Keychain by the
local helper, rather than in the portal’s profile file. The portal only shows
whether a password is configured; it never displays the saved password back to
you. It is still sensible to use a dedicated, limited-scope password where you
can, and to lock your Mac when you leave it.

Touch Pass is a convenience device, not a security boundary. The ZW101 sensor
link is an **unauthenticated UART** connection, so someone with physical access
to the hardware could potentially spoof sensor traffic. Password and custom
text actions also have an unavoidable keyboard limitation: USB HID types into
the **focused** window or field. A misleading page, popup, or wrong cursor can
receive what you meant for something else.

Use the macOS input source **ABC** or **US** for password and custom Text
actions. They type ASCII keyboard input; another layout can turn the characters
into the wrong symbols even when the saved value is correct.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| Portal says it cannot find the ESP32-S3 | Keep the helper running, reconnect the USB data cable, and revisit the helper startup step in the [build guide](BUILD_GUIDE.md#start-helper-and-portal). |
| ESP32-S3 is connected but ZW101 is still checking or unavailable | Restart the helper once. If it persists, check the sensor wiring and 3.3 V supply using the [build guide](BUILD_GUIDE.md#troubleshooting). |
| A slot will not enroll | Make sure no other enrollment/deletion is running, clean the sensor, and follow the touch–lift–same-touch prompts slowly. |
| My control action did nothing | Use the same enrolled finger twice within three seconds. Check that the intended app or field is focused. |
| Password text is wrong | Switch to ABC or US input, click the intended password field, then test carefully. If the password changed, update it in Configure. |
| The action went to the wrong app | Stop and refocus the right window or field. This is expected focused-window HID behavior; Touch Pass cannot choose the destination for you. |
| I need to remove a finger or a saved password | Delete that slot in the portal. This clears its fingerprint profile and its slot-specific Keychain password. |
| I cannot save a new password action | Enter a non-empty ASCII password the first time. Leaving the box blank only keeps a password that was already configured. |
| A custom macro will not save | Check for at most 16 steps, ASCII Text, a supported Key name, and a Delay between 0 and 5000 ms. |

## Safe-use checklist

Before every touch that can type or approve something, take a short pause:

- Is this the expected window and is the exact field focused?
- Is macOS using the ABC or US keyboard layout?
- Have I read the prompt myself and confirmed that `y` + Return, Enter, or
  Escape is really the response I want?
- For a password, am I comfortable entering it through this convenience device?
- For a control action, am I ready to make the intentional second touch within
  three seconds?
- Have I tested a new or edited action in a harmless text editor first?

If any answer is no, do not touch the sensor yet. Focus a safe test field,
check the configuration in the local portal, and try again deliberately.
