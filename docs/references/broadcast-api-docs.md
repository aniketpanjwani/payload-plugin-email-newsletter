# Broadcast Documentation

*Scraped from https://sendbroadcast.net/docs/*

---

## Introduction

*Source: https://sendbroadcast.net/docs/*

# Documentation

  
    
      
        
      
    
    
      
### Our documentation is currently under construction.

      
        Our documentation is currently under construction, so you may expect missing parts. Need help? Email us at [[email&#160;protected]](/cdn-cgi/l/email-protection#8ffce6e2e0e1cffceae1ebedfde0eeebeceefcfba1e1eafbb0fcfaede5eaecfbb2cbe0ecfae2eae1fbeefbe6e0e1afe9eaeaebedeeece4).
      
    
  

**Welcome to the Broadcast documentation!**

Here is everything you need to know to install and use Broadcast.

If we are missing anything here or if anything is unclear, please email us at [[email&#160;protected]](/cdn-cgi/l/email-protection#2c5f454143426c5f4942484e5e434d484f4d5f5802424958135f594e46494f581168434f59414942584d584543420c4a4949484e4d4f47).

---

## Terminology

*Source: https://sendbroadcast.net/docs/terminology*

# Terminology

Most of the terminologies used in Broadcast should be familar with users familiar with email marketing.

We will list them here for your reference and what they mean inside the context of the Broadcast application.

## broadcast channel

Also known as **channels**, these are the silos for your subscribers and the emails you send to them.

On other platforms, this is often referred to as a &ldquo;list&rdquo;.

## broadcast emails

Aside from being the name of the software, we refer to **broadcast emails** as the emails that you manually send.

These are typically used for one-time email blasts, such as newsletters, alerts, or promotional emails.

## email sequences

Also known as &ldquo;drip campaigns&rdquo;, **email sequences** are a series of automated emails sent to your subscribers based on a specific schedule or trigger event.

## transactional emails

**Transactional emails** are emails that are sent programmatically triggered through the API.

These are typically used for one-time emails triggered by specific user actions, such as password resets, order confirmations, or shipping notifications.

## subscribers

**Subscribers** are the users who have opted in to receive your emails or you have added manually to your channel.

They are usually collected through a signup form or other opt-in process, or imported manually from an external system.

---

## Setup

*Source: https://sendbroadcast.net/docs/setup*

# Setup

The setup process for Broadcast is straightforward and involves a few simple steps.

## Initial onboarding

When you first install Broadcast, you must go to your installed domain.

Say, for example, you installed Broadcast at `https://broadcast.example.com`, you must go to `https://broadcast.example.com` immediately after installation to set up your administrative account.

Note: Future versions of Broadcast will support multiple administrative users. For the time being, only one user is supported.

Once set up, Broadcast will ask you to confirm the domain it is installed at, and a name for the default [broadcast channel](/docs/terminology).

## Setting up your channel

Before you can begin sending any email messages, you must configure your channel settings.

This includes:

- Sender name and email address (eg. &ldquo;John Doe&rdquo; [[email&#160;protected]](/cdn-cgi/l/email-protection#b9d3d6d1d797ddd6dcf9dcc1d8d4c9d5dc97dad6d4)). All emails sent from this specific channel will appear to come from this sender.

- At least one SMTP server for sending emails.

For SMTP settings, you must provide:

- SMTP server address

- SMTP server port

- SMTP authentication type (None, Login, or CRAM-MD5)

- SMTP username

- SMTP password

- Email types that can be sent from this server (Broadcast, Sequences, and/or Transactional Emails)

Once you have entered your SMTP settings, click on the &ldquo;Test SMTP settings&rdquo; button to verify that your settings are correct. We need to make sure that Broadcast can login to your SMTP server and send emails.

Once you have set up your channel, you can begin sending messages. Broadcast will let you know if any settings are missing or invalid.

---

## Channels

*Source: https://sendbroadcast.net/docs/channels*

# Channels

Channels in Broadcast, also known as a &ldquo;list&rdquo; in other email marketing software, is where you organize your subscribers. From within a channel, you can send three different types of emails:

- Broadcasts (manual email campaigns)

- Sequences (DRIP style automation email sequences)

- Transactional emails via the API (eg. password resets)

## Creating a Channel

By default, your installation requires you to have at least one channel. You can have multiple channels to organize different parts of your business (eg. enterprise customers vs small-medium B2B customers), or different projects altogether.

To create a new channel, click on **Switch Channel** in the upper left corner of the screen.

From there, you will see a link that says **create a new one** to create a new channel.

## Switching Channels

To switch between channels, click on **Switch Channel** in the upper left corner of the screen and select the channel you want.

You can always check which channel you are in by looking at the channel name on the upper left corner of the screen in the sidebar (on the desktop). It will say **Current Channel**.

## Deleting a Channel

To preserve your data, you cannot delete a channel. However, you can deactivate a channel by going to **Channel Settings** and clicking on **Deactivate channel**.

## Understanding how channels work

All settings, subscribers, broadcasts, sequences, and transactional emails are channel-specific. This means that if you have a channel called &ldquo;Enterprise&rdquo;, all of the settings, subscribers, broadcasts, sequences, and transactional emails will only apply to the &ldquo;Enterprise&rdquo; channel.

This allows you to have a separate setup for each of your channels, which is useful if you have different opt-in forms, or want to send different content to different groups of people.

---

## Managing Subscribers

*Source: https://sendbroadcast.net/docs/managing-subscribers*

# Managing Subscribers

Subscribers are the people you want to send emails to. Both Broadcast and Sequence emails require a subscriber to be present in the channel they are being sent from.

Transactional emails do not require a subscriber to be present in the channel they are being sent from.

## Subscriber Information

For each subscriber, you can store the following information:

- Email address (required)

- First name

- Last name

- IP address

- Tags (comma separated list of tags)

- Active (true or false)

- Subscribed at date (required)

- Unsubscribed at date

The required values are indicated above.

For data protection reasons, you cannot alter the unsubscribed at date. For the subscribed at date, this is set automatically when a subscriber is entered manually.

When importing subscribers via a TSV file or adding subscribers via the API, the subscribed at date can be specified.

## Adding Subscribers

There are three ways to add subscribers to a channel:

- Manual entry

- TSV import (tab separated values)

- API integration

### 1. Adding subscribers manually

To manually add a subscriber, click on **Subscribers** in the sidebar, click on **Add subscriber**.

Fill in the required fields and click **Add subscriber**.

### 2. Adding subscribers via TSV import

To add subscribers via a TSV file, click on **Subscribers** in the sidebar, click on **Add subscribers**. From there, you will see an option to upload via a TSV file.

Follow the instructions on the screen to create and upload your TSV file. It is recommended that you use a spreadsheet program like Google Sheets and export the file as a TSV format.

### 3. Adding subscribers via API

Documentation coming!

## Segmentation

A native segmentation feature is not yet available but is on the roadmap.

## Viewing Subscribers

To view subscribers, click on **Subscribers** in the sidebar.

You can also search for specific subscribers by entering their full or partial email address, or by entering their name. The system will try to find the closest match.

When you click on a subscriber, you will see their details and be able to edit them. As well, on the right hand side of the screen, you will be able to see all recent activity associated with this subscriber, such as:

- API related activities (if any)

- Broadcasts that have been sent to this subscriber

- Sequences that this subscriber is in

- Transactional emails that have been sent to this subscriber

## Active vs Unsubscribed Status

Subscribers can be marked as active or active. Subscribers can also be noted to have unsubscribed from the channel.

The difference between active and unsubscribed is important to understand.

A subscriber who is marked as active will continue to receive all broadcasts, sequences, and transactional emails sent from the channel.

An unsubscribed subscriber will not receive any emails sent from the channel, irrespective of whether they are active.

The easiest way to differentiate this is that the unsubscribed status is set by the subscriber themselves, and the active status is set internally by you.

For this reason, it is recommended that if you have different interactions with subscribers (eg. transactional emails vs marketing emails), duplicate the subscriber in two separate channels.

## Exporting Subscribers

An export feature is not yet available but is on the roadmap.

---

## Broadcast Emails

*Source: https://sendbroadcast.net/docs/broadcast-emails*

# Broadcast Emails

Broadcast emails allow you to send one-time messages to your subscribers. This guide covers creating, scheduling, and analyzing broadcast emails.

Broadcasts are organized per [Channel](/docs/channels). You cannot send a broadcast to subscribers from another channel.

If you are working with multiple channels, make certain that you are in the correct channel before you start creating a broadcast.

## Creating a Broadcast

To create a broadcast, click on **Broadcasts** in the left sidebar and then click on the **New Broadcast** button.

Once there, you will see a form to fill in the details of your broadcast. Click on **Create Broadcast** to save your changes. The broadcast will be saved and will be in **Draft** status.

The form options you have available are:

- **Name**: The name of the broadcast.

- **Subject**: The subject of the broadcast.

- **Preheader**: The text that will be shown in the preheader of the email.

- **Body**: The content of the broadcast.

- **Tracking Options**: The options for tracking the broadcast. You can choose to track if the email was opened or clicked.

- **Email Server**: The email server that will be used to send the broadcast.

## Testing a Broadcast

It is recommended that once you are done composing your email, you should test send the email to yourself to make sure that the content is displayed correctly.

To test send a broadcast, click on **Test Send** in the top right corner of the screen under the dropdown.

Enter the email address that you would like to test send, and Broadcast will queue a test email to that address.

## Sending a Broadcast

To send a broadcast, click on **Send** in the top right corner of the screen.

Broadcast will immediately queue the email to be sent.

You will see the status of the send immediately on the screen with a progress bar.

Should any issues arise, such as SMTP errors, the broadcast will immediately be aborted and marked as failed.

---

## Email Sequences

*Source: https://sendbroadcast.net/docs/email-sequences*

# Email Sequences

Email sequences, also known as DRIP campaigns, allow you to send a series of automated emails to your subscribers. This guide covers creating and managing email sequences in Broadcast.

## How Email Sequences Work

Email sequences are made up of a series of steps.

The first step of all sequences is the **Entry Point** step. This step cannot be deleted, and all steps follow this **Entry Point** step.

Following the **Entry Point**, you can add as many steps as you would like. It is, however, recommended that you keep the email sequence simple.

Instead, to design more complex email automations, you should use multiple sequences and design sequences to transfer subscribers from one sequence to another (see below for more information).

## Creating an Email Sequences

To create an email sequence, navigate to the **Sequences** page in the sidebar and click on **New Sequence**.

A new sequence will be created with the default name of **Untitled Sequence**.

You will see a subdashboard showing you a list of subscribers to the current sequence.

On the upper right hand corner of the screen, you will see a **Settings** button. Clicking here will open a sidebar where you can change the name of the sequence. It is recommended that you give your sequence a recognizable name (eg. New User Onboarding).

A dropdown menu is also available by clicking on the down arrow beside the **Settings** button. From there you can:

- Edit the steps of the sequence

- Delete the sequence

Let&rsquo;s talk about how to manage the steps of an email sequence in the next sections.

## Managing the Steps of an Email Sequence

When managing the steps of an email sequence, the first step of all sequences is the **Entry Point** step. This step cannot be deleted, and all steps follow this **Entry Point** step.

You can add subsequent steps to this by clicking on the **+** button underneath the step you want to add a new step.

Currently, these are the types of steps you can add:

- Send Email

- Add Delay

- Add Delay Until Specific Time (Next Day, Next Week, etc.)

- Add Condition

- Move Subscribers to Sequence

- Add Tags to Subscriber

- Remove Tags from Subscriber

- Make Subscriber Inactive

The names of these steps should hopefully be self explanatory, but we will go over each of them in more detail below.

### 1. Send Email

The **Send Email** step allows you to send an email to a subscriber.

Here, you can modify the following parts of an email:

- Subject line

- Preheader text

- Email body

Note that at the **Sequence** level, you can choose which email server to use for sending all emails from this sequence. As well, you can also choose whether to track opens or clicks for sent emails from this sequence. Be aware that if you are using any conditional steps that requires knowing whether an email is opened or clicked, Broadcast will automatically enable open/click tracking at the sequence level for you.

### 2. Add Delay

The **Add Delay** step allows you to add a delay between the current step and the next step.

This is useful for introducing a minimum delay between two steps that affects users, such as sending emails or making a subscriber inactive due to a lack of engagement.

Note that delays are guaranteed to be early, meaning that the delay set is the minimum delay that will be applied. There may be a 30-60 second lag behind the delay set, depending on the load of your server.

The other thing to know about delays is that if the **next step** is a Conditional Step (see below), the delay introduced will be in addition to the delay set in the conditional step. If you do not want to track the delay in both a delay step and an immediately following conditional step, do not add the delay step and just add a conditional step.

### 3. Add Delay Until Specific Time (Next Day, Next Week, etc.)

The **Add Delay Until Specific Time** step allows you to add a delay until a specific time.

This is useful for scheduling emails to be sent at a specific time in the future.

Note that this feature can be a bit confusing, so here is some examples of how this type of delay works:

- If you set the delay to &ldquo;8:00 AM&rdquo;, the email will be sent at 8:00 AM on the next day after the previous step.

- If the step is the first step in the sequence, and the subscriber was added at 7:50 AM, the email will be sent at 8:00 AM on the same day.

Internally, this delay is calculated as the next available time that you have specified. The calculation happens at the time of the previous step.

You must specify a timezone for this delay during this step so the system knows what timezone we are operating in.

### 4. Add Condition

The **Add Condition** step allows you to add a condition to the sequence.

The condition will be evaluated as either being true or false, allowing you to create **branches** within your sequence. This provides a flexibility in allowing you to design complicated sequences.

Currently, there are four types of conditions you can use:

- Any email opened (ie. any email sent from this sequence was opened)

- Previous email opened (ie. if the immediately previous email was opened)

- Any email clicked (ie. any email sent from this sequence was clicked)

- Previous email clicked (ie. if the immediately previous email was clicked)

With each condition, you can specify the **delay** before the condition is evaluated.

Your use-case will likely vary, but here are some examples:

- Add a condition with a 24 hour delay. If the previous email was clicked, add a tag to the subscriber indicating high engagement.

- In the &ldquo;false&rdquo; branch of the above condition, add an additional condition with a delay of 1 week. If the subscriber clicks on the email, move the subscriber to medium engagement.

- Etc.

### 5. Move Subscribers to Sequence

The **Move Subscribers to Sequence** step allows you to move subscribers to another sequence.

This feature is useful for keeping your sequences simple and manageable. Designing complicated sequence flows can be done by creating multiple, simpler sequences and then moving subscribers from one sequence to another. Using this feature with conditional steps allows you to create complicated flows.

### 6. Add Tags to Subscriber

The **Add Tags to Subscriber** step allows you to add tags to a subscriber.

You can add multiple tags to a subscriber in a single sequence step.

### 7. Remove Tags from Subscriber

The **Remove Tags from Subscriber** step allows you to remove tags from a subscriber.

Note that you can remove multiple tags from a subscriber in a single sequence step. The system will attempt to remove all the specified tags from the subscriber. The subscriber does not need to have all the tags. This still will just ensure that none of the specified tags are present on the subscriber after this step.

### 8. Make Subscriber Inactive

The **Make Subscriber Inactive** step allows you to make a subscriber inactive.

The subscriber will be set as inactive not just in this sequence, but in the current channel. This will affect all sequences, broadcasts, and transactional emails sent from Broadcast **in the current channel**.

Use this sequence step as sort of a &ldquo;last resort&rdquo; to remove a subscriber altogether.

## Adding Subscribers to an Email Sequence

Subscribers can be added to an email sequence in three ways.

- Manually add subscribers to the sequence

- Add subscribers to the sequence when a tag is added to the subscriber itself

- Add a subscriber to a sequence with the API

### 1. Manually add subscribers to the sequence

To add a subscriber to the sequence, navigate to the **Sequences** page in the sidebar and click on the sequence you want to add a subscriber to.

There, you will see a table of current subscribers within this sequence.

Click **Add Subscriber** and filter the subscriber list with the name of the subscriber you want to add.

If a subscriber is already part of the sequence, Broadcast will filter these out to minimize the list of available subscribers.

### 2. Add subscribers to the sequence when a tag is added to the subscriber itself

You can also specify whether a subscriber will be added to a particular sequence through a tag.

To specify which tag the system should detect in order to add a subscriber to a sequence, navigate to the Sequence Steps editor and click on the **Entry Point** step.

Within one of the form fields, you will see an input field for **Tags**. Input the single tag you would like to use to add a subscriber to the sequence. Note that the system does not support detecting multiple tags.

### 3. Add a subscriber to a sequence with the API

Please refer to the API documentation for details on how to manage subscribers with sequences.

## Removing Subscribers from an Email Sequence

There are several ways to &ldquo;remove&rdquo; a subscriber from an email sequence.

- Inactive or unsubscribed subscribers will not be included in the sequence. As a result, you can unsubscribe a subscriber and they will be removed from all seequences.

- Subscribers can be removed from the sequence manually, such as in the dashboard.

- Subscribers can be removed from the sequence when a tag is removed from the subscriber itself. This can be done programmatically using the API or manually in the dashboard.

- Subscribers can be set as &ldquo;removed&rdquo; in the sequence. This is done manually in the dashboard.

Depending on how you intend to manage your email list, pick the one that most makes sense for your situation.

---

## Transactional Emails

*Source: https://sendbroadcast.net/docs/transactional-emails*

# Transactional Emails

Transactional emails are one-time emails sent to users based on specific triggers, such as password resets or order confirmations.

To send a transactional email, this must be done with the use of the API.

Typically, you will want to send these emails from an existing application that you built, or via a custom integration with Zapier or Make.

To learn how to use this feature, please see the [API documentation for transactional emails](/docs/api-transactional-email).

---

## Unsubscribe Settings

*Source: https://sendbroadcast.net/docs/unsubscribe-settings*

# Unsubscribe Settings

Having an option to unsubscribe from your emails is a legal requirement in many jurisdictions. As well, many email service providers require unsubscribe links to be present in outbound emails.

Please refer to rules and regulations of the countries you are sending emails to for more information.

Broadcast allows you to manage your unsubscribe settings in your outbound emails.

## Unsubscribe Link

On a per channel basis, you can set a default unsubscribe link that will be used in your automated emails ([Broadcasts](/docs/broadcast-emails) and [Email Sequences](/docs/email-sequences)).

To set the Unsubscribe Link, click on **Channel Settings** in the left sidebar. In the form field, you will see the option to set the Unsubscribe Link.

Because each link is unique to a channel and the subscriber, you cannot set a hard-coded value for the link.

Instead, Broadcast will generate a link for you that you can use in your emails.

To specify the link, you can use the `{{ unsubscribe_link }}` variable in your emails.

## Server-Specific Unsubscribe Link

Some email service providers have specific unsubscribe link options.

For example, Postmark has a slightly different unsubscribe link format. Without specifying this unsubscribe link, Postmark will automatically try to insert another link, which will make your email appear as if there are duplicate links.

To specify the server-specific unsubscribe link, click on **Channel Settings** in the left sidebar.

Under **Email Servers**, select the email server you want to customize the unsubscribe link for.

Go to **Custom Unsubscribe Settings** and enable the option **Customize unsubscribe link**. Once you do that, the form field **Customize unsubscribe link for this server** will appear.

For Postmark, for example, it uses the following format:

```
{{{ pm:unsubscribe }}}

```

So, you can enter something like this:

```
<a href="{{{ pm:unsubscribe }}}">Unsubscribe to our emails</a>

```

Once Postmark detects this link format, it will use it instead of appending its own.

## Email Provider Unsubscribe Link

You might notice that in cases where the email service provider injects its own unsubscribe link, Broadcast&rsquo;s own unsubscribe page will not be used.

This is because the email service provider&rsquo;s link takes precedence over Broadcast&rsquo;s.

Unfortunately, there is no easy way to override this without contacting the email service provider.

However, you can set up webhooks for the email service provider to let Broadcast know when a subscribe has unsubscribed. This way, your subscriber list will be up-to-date.

To learn more about email metric integration, please see the [Email Metrics](/docs/email-metrics) guide.

## Disabling Unsubscribe Link & Header

Broadcast provides an option to disable the unsubscribe link altogether in your emails. This is useful for specifying email servers that are meant to send only transactional emails, for example.

Be careful about disabling the unsubscribe link, as it is a legal requirement in many jurisdictions.

To disable a link, click on **Channel Settings** in the left sidebar. Go to **Email Servers** and select the email server you want to disable the unsubscribe link for.

In the **Custom Unsubscribe Settings** section, uncheck the option **Include unsubscribe link** and **Include unsubscriber header**.

Note that having an unsubscribe link (and header) is considered best practice, and helps with deliverability.

---

## Email Metrics

*Source: https://sendbroadcast.net/docs/email-metrics*

# Email Metrics

Broadcast allows you to track email metrics such as opens, clicks, and bounce rates.

There are two ways to track email metrics:

- Natively within the Broadcast software.

- By integrating with the email service provider&rsquo;s metrics.

## Native Metrics

Currently, it is possible to enable native metrics for Broadcasts and Sequences.

In order to enable native metrics, all you need to do is to enable the &ldquo;Track Opens&rdquo; and &ldquo;Track Clicks&rdquo; options in the Broadcast or Sequence settings.

## Email Service Provider Metrics

Broadcast can also integrate with your email service provider to track metrics such as opens, clicks, and bounce rates.

Currently, the following email service providers are supported:

- AWS SES

- Mailgun

- Postmark

- SendGrid

### Setting up AWS SES

AWS SES metric integration requires you to set up a SNS topic. Follow the steps below to set it up.

- 
In the AWS Console under the same region as your AWS SES account, create a new SNS topic. Create a topic, and choose &ldquo;Standard&rdquo; as the type.

- 
Give the topic a name, such as &ldquo;broadcast&rdquo;. You can leave the rest of the settings as default. Click on &ldquo;Create topic&rdquo;.

- 
Once created, click on &ldquo;Create subscription&rdquo; button. You will see a screen where you need to configure the endpoint where your AWS SNS Topic will send webhooks to.

- 
Choose &ldquo;HTTPS&rdquo; as the protocol. For the endpoint itself, go to your Broadcast dashboard, click on &ldquo;Channel Settings&rdquo;, then &ldquo;ESP Integrations&rdquo;, and you will see your endpoint.

- 
For example, if your installation is at https://broadcast.yourdomain.com, your endpoint will be at https://broadcast.yourdomain.com/wh/ses. You will see a message that says, &ldquo;Waiting for verification&hellip;&rdquo;. Keep this tab open because the next step will require you to copy and paste the URL that AWS SNS sends to this screen.

- 
Go back to the AWS Console, and click on &ldquo;Create subscription&rdquo;. AWS SNS will send a confirmation request to the endpoint.

- 
Go back to the Broadcast screen, and copy and paste the verification URL that AWS SNS sent to this screen.

- 
Check that the endpoint has been verified in the AWS Console. Under &ldquo;Subscriptions&rdquo;, you should see the status as &ldquo;Confirmed&rdquo;. If you go back to the Broadcast dashboard, you will see the &ldquo;Waiting for verification&hellip;&rdquo; if you refresh the page. You do not need to configure anything else here, as Broadcast will receive any messages sent from AWS SNS and verify the message internally.

- 
Now, leave the AWS SNS screen, and go to your AWS SES dashboard. On the side menu, click on &ldquo;Configuration sets&rdquo; and &ldquo;Create set&rdquo;.

- 
Give it a name, such as &ldquo;broadcast&rdquo;. You will need this name later, so make sure to remember it. Leave the rest of the settings as default. Click on &ldquo;Create set&rdquo;.

- 
Once the set is created, click on &ldquo;Event destinations&rdquo; and then on &ldquo;Add destination&rdquo;. Click &ldquo;Select All&rdquo; for all the events (eg. sends, rejects, etc), as well as opens and clicks.

- 
On the next screen, you will need to configure the destination. Give your destination a name, such as &ldquo;broadcast&rdquo;. Click on Amazon SNS, and on the bottom select the topic you created in the above steps. Click &ldquo;Next&rdquo; and &ldquo;Add destination&rdquo;.

- 
There is one more step. Within the Broadcast dashboard, go to &ldquo;Channel Settings&rdquo;, then &ldquo;Email Servers&rdquo;. Click on your AWS email server to edit it. Under &ldquo;AWS SES Configuration Set&rdquo;, enter the name you chose above for the configuration set. Click &ldquo;Update&rdquo;.

To test the integration, you can send a test email from Broadcast.

The easiest way to do this is manually add a subscriber. Go to subscribers, click on &ldquo;Add subscriber&rdquo;, and add a subscriber with an email of &ldquo;[[email&#160;protected]](/cdn-cgi/l/email-protection)
&rdquo;. This is a test email address that will bounce if used.

Create a new broadcast, and send it. If you go to the subscriber&rsquo;s detail page, you will see that the AWS SES event is being forwarded from AWS. Because the subscriber&rsquo;s email bounces, Broadcast has automatically unsubscribed and deactivated this subscriber.

Note that once the system detects a bounce, the system does not allow the user to be resubscribed in order to protect your list from having future deliverability issues.

### Setting up Mailgun

Documentation for Mailgun is coming soon.

### Setting up Postmark

Documentation for Postmark is coming soon.

### Setting up SendGrid

Documentation for SendGrid is coming soon.

---

## Upgrading

*Source: https://sendbroadcast.net/docs/upgrading*

# Upgrading

The following guide is intended for users who had installed Broadcast using the Automatic Installation method.

## Before You Upgrade

- Back up your database

## Upgrade Process

To upgrade your Broadcast installation, go to **Application** and click on **Check for updates**.

Click on **Check for updates** once more and the application will check for updates with the central upgrade server.

If an update is available, click on **Upgrade now** and you will see a popup window asking you to confirm whether you want to begin the upgrade.

The upgrade will take about 5-10 minutes (usually less). During the upgrade, your application will be unavailable for a period of several minutes. This is normal and your system will resume once the upgrade is completed.

## What is happening during the upgrade?

During the upgrade process, the system will:

- Stop the running application

- Download the new version of the application

- Restart the application, performing any database updates

## Troubleshooting

If you experience any issues during the upgrade process, feel free to contact us for support.

Here are some steps you can use to manually check your upgrade. You will need to SSH into your server system as `root`.

```
# First, check to see what is happening with the application.
# It may still be upgrading as sometimes the upgrade takes
# longer than anticipated.
systemctl status broadcast

# Go to the Broadcast installation directory
cd /opt/broadcast

# Stop the running application
./broadcast.sh stop

# Update the installer code
./broadcast.sh update

# Run the following to clean up any old trigger files
./broadcast.sh trigger

# Manually run the upgrade
./broadcast.sh upgrade

# Restart the application
./broadcast.sh start

```

Pay attention to any error messages (if any are outputted). If things do not work as expected, forward us the complete output from the above commands.

---

## API Authentication

*Source: https://sendbroadcast.net/docs/api-authentication*

# Authentication to use the Broadcast API

In order to use the Broadcast API, you need to get an Access Token (API Key).

## Creating an Access Token

By default, Broadcast creates an Access Token when you install the application.

This initial Access Token is set up so that you can send transactional emails.

However, you can create an unlimited number of additional Access Tokens, each with their own scope of permissions.

Here are the different scopes you can set for an Access Token:

- List and read broadcasts (Read)

- Send and update broadcasts (Write)

- List and read transactional emails (Read)

- Send transactional emails (Write)

- List and read subscribers (Read)

- Create and update subscribers (Write)

- List and read subscribers in sequences (Read)

- Add or remove subscribers from sequences (Write)

The labeling of the scopes should be self-explanatory.

Whenever possible, create a new access token with the exact permissions you need and not more

## Using an Access Token

All requests to the Broadcast API need to include the Access Token in the HTTP header.

To use an Access Token, you need to include it in the `Authorization` header of your HTTP requests:

```
Authorization: Bearer <YOUR_ACCESS_TOKEN>

```

If your Access Token tries to make a request that it is not authorized to make, you will get a 401 (Unauthorized) response code.

## Managing Your Access Tokens

To view and manage your Access Tokens, click on **Access Tokens** in the left sidebar of the dashboard.

---

## API Subscribers

*Source: https://sendbroadcast.net/docs/api-subscribers*

# Subscribers API

The Subscribers API allows you to programmatically manage your subscriber list.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- List and read subscribers (Read)

- Create and update subscribers (Write)

## Subscriber Object

The subscriber object contains the following fields:

  
    
      Field
      Description
    
  
  
    
      `id`
      The ID of the subscriber
    
    
      `email`
      The email address of the subscriber
    
    
      `first_name`
      The first name of the subscriber
    
    
      `last_name`
      The last name of the subscriber
    
    
      `ip_address`
      The IP address of the subscriber
    
    
      `is_active`
      Whether the subscriber is active
    
    
      `source`
      The source of the subscriber
    
    
      `subscribed_at`
      The date and time the subscriber was subscribed
    
    
      `unsubscribed_at`
      The date and time the subscriber was unsubscribed
    
    
      `created_at`
      The date and time the subscriber was created
    
    
      `tags`
      An array of tags associated with the subscriber
    
  

## List Subscribers

```
GET /api/v1/subscribers.json

```

### Parameters

- `page`: The page number to return (default is 1)

### Request

```
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://your-broadcast-domain.com/api/v1/subscribers.json?page=1

```

### Response

```
{
  "subscribers": [
    {
      "id": "123",
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
      "first_name": "John",
      "last_name": "Doe",
      "ip_address": "192.168.1.1",
      "is_active": true,
      "source": "web_form",
      "subscribed_at": "2024-03-20T10:00:00Z",
      "unsubscribed_at": null,
      "created_at": "2024-03-20T10:00:00Z",
      "tags": ["newsletter", "product-updates"]
    }
  ],
  "pagination": {
    "total": 1500,
    "count": 250,
    "from": 1,
    "to": 250,
    "current": 1,
    "total_pages": 6
  }
}

```

## Find Subscriber

This endpoint can be used to find a subscriber by email address and to return the details stored in your Broadcast database.

```
GET /api/v1/subscribers/find.json

```

### Parameters

- `email` (required): Email address of the subscriber

### Request

```
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://your-broadcast-domain.com/api/v1/subscribers/[[email&#160;protected]](/cdn-cgi/l/email-protection)

```

### Response

```
{
  "id": "123",
  "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "first_name": "John",
  "last_name": "Doe",
  "ip_address": "192.168.1.1",
  "is_active": true,
  "source": "web_form",
  "subscribed_at": "2024-03-20T10:00:00Z",
  "unsubscribed_at": null,
  "created_at": "2024-03-20T10:00:00Z",
  "tags": ["newsletter", "product-updates"]
}

```

## Create Subscriber

This endpoint can be used to create a new subscriber.

### Parameters

The following parameters need to be &ldquo;namespaced&rdquo; under the `subscriber` key. See the cURL example for an example.

- `email` (required): Email address of the subscriber

- `first_name`: First name of the subscriber

- `last_name`: Last name of the subscriber

- `ip_address`: IP address of the subscriber

- `is_active`: Indicates if the subscriber is active

- `source`: Source of the subscriber

- `subscribed_at`: Timestamp when the subscriber was added

- `tags`: Array of tags to add to the subscriber

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "subscriber": {
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
      "first_name": "John",
      "last_name": "Doe",
      "ip_address": "192.168.1.1",
      "is_active": true,
      "source": "web_form",
      "subscribed_at": "2024-03-20T10:00:00Z",
      "tags": ["newsletter", "product-updates"]
    }
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers.json

```

Note that when adding a `tags` array, you must send an array of strings.

### Response

The response code will be 201 (Created) if the subscriber was created successfully.

If a subscriber already exists in the system (eg. such as if a subscriber is added and is unsubscribed), the response will also be 201. Note that in this case, the system will assume that the subscriber has re-subscribed and will set the unsubscribed_at field as null. Any attributes passed along to the API will also be updated at the same time.

If the request is invalid, the response code will be 422 (Unprocessable Entity). The error message will be returned in the response body.

Example of an error response:

```
{
  "errors": {
    "email": ["has already been taken"]
  }
}

```

## Update Subscriber

This endpoint can be used to update a subscriber details.

### Parameters

The parameters are the same as the create subscriber endpoint, but only the fields you want to update need to be included in the request.

Again, the parameters need to be &ldquo;namespaced&rdquo; under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X PATCH \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
    "subscriber": {
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
    }
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers.json

```

Note that the endpoint does not fully fit with typical RESTful conventions, as we include the email address as part of the parameters to identify the subscriber record.

### Response

The response code will be 200 (OK) and will return the subscriber JSON object.

If the request is invalid, the response code will be 422 (Unprocessable Entity). The error message will be returned in the response body.

## Deactivate Subscriber

You can deactivate a subscriber using the following endpoint:

```
POST /api/v1/subscribers/deactivate.json

```

### Parameters

- `email` (required): Email address of the subscriber to deactivate

The parameter can be either passed directly or namespaced under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers/deactivate.json

```

### Response

The response code will be 200 (OK) if the subscriber was successfully deactivated.

## Activate Subscriber

This endpoint allows you to reactivate a previously deactivated subscriber.

```
POST /api/v1/subscribers/activate.json

```

### Parameters

- `email` (required): Email address of the subscriber to activate

The parameter can be either passed directly or namespaced under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers/activate.json

```

### Response

The response code will be 200 (OK) if the subscriber was successfully activated.

## Add Tags To Subscriber

This endpoint allows you to add one or more tags to a subscriber.

```
POST /api/v1/subscribers/add_tag.json

```

### Parameters

- `email` (required): Email address of the subscriber

- `tags` (required): An array of tags to add to the subscriber

The parameter can be either passed directly or namespaced under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
    "tags": ["newsletter", "product-updates"]
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers/add_tag.json

```

### Response

The response code will be 200 (OK) if the tags were successfully added.

## Remove Tags From Subscriber

This endpoint allows you to remove one or more tags from a subscriber.

```
DELETE /api/v1/subscribers/remove_tag.json

```

### Parameters

- `email` (required): Email address of the subscriber

- `tags` (required): An array of tags to remove from the subscriber

The parameter can be either passed directly or namespaced under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
    "tags": ["newsletter"]
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers/remove_tag.json

```

### Response

The response code will be 200 (OK) if the tags were successfully removed.

---

## API Broadcasts

*Source: https://sendbroadcast.net/docs/api-broadcasts*

# Broadcast API

The Broadcast API allows you to programmatically create draft broadcasts. These will create broadcasts in the draft state, which you can then manually trigger through Broadcast&rsquo;s own API after verifying that the broadcast is ready to send.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- Create broadcasts (Write)

## Broadcast Object

The broadcast object contains the following fields:

  
    
      Field
      Description
    
  
  
    
      `id`
      The unique identifier of the broadcast
    
    
      `subject`
      The subject line of the email
    
    
      `preheader`
      Preview text that appears in email clients
    
    
      `body`
      The content of the email
    
    
      `name`
      The internal name of the broadcast
    
    
      `track_opens`
      Whether open tracking is enabled for this broadcast
    
    
      `track_clicks`
      Whether click tracking is enabled for this broadcast
    
  

You will notice that several properties of broadcasts are not included in the object. At the moment, the above properties are the only ones which are exposed through this API.

## Create (Draft) Broadcast

```
POST /api/v1/broadcasts.json

```

### Parameters

- `subject` (required): Subject line of the email

- `body` (required): Content of the email, which can be either a simple string or HTML. In either case, Broadcast will wrap the content in the appropriate html and body tags. If you want to incorporate an entire HTML design, just send the contents within the body tag.

- `preheader` (recommended): Preview text that appears in email clients

- `name` (required): Internal name of the broadcast

- `track_opens` (optional): Whether open tracking is enabled for this broadcast

- `track_clicks` (optional): Whether click tracking is enabled for this broadcast

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "broadcast": {
      "subject": "Test Subject",
      "preheader": "Test Preheader",
      "body": "<p>Test Body</p>",
      "name": "Test Name",
      "track_opens": true,
      "track_clicks": true
    }
  }' \
  http://your-domain.com/api/v1/broadcasts

```

Take note that the `body` field should be a valid HTML string. If it is not a valid HTML string, the broadcast&rsquo;s rendered body will be malformed.

When you edit a draft broadcast, the application will attempt to fix any malformed HTML, but this is not always possible.

In general, line breaks should be represented as `<br>` tags, and paragraphs should be wrapped in `<p>` tags. If you reference images, you must ensure that the image URL is valid.

You do not need to include the head or body tags in the body field. Broadcast will automatically wrap the content of your body during the outbound mail processing.

### Response

```
{
  "id": "123",
  "subject": "Test Subject",
  "preheader": "Test Preheader",
  "body": "<p>Test Body</p>",
  "name": "Test Name",
  "track_opens": true,
  "track_clicks": true,
  "created_at": "2024-03-21T09:00:00Z",
  "updated_at": "2024-03-21T09:00:00Z"
}

```

If the request is invalid, the response code will be 422 (Unprocessable Entity). The error message will be returned in the response body:

```
{
  "errors": {
    "subject": ["can't be blank"],
    "body": ["can't be blank"]
  }
}

```

---

## API Transactional Email

*Source: https://sendbroadcast.net/docs/api-transactional-email*

# Transactional Email API

The Transactional Email API allows you to programmatically send individual, personalized emails triggered by specific events in your application.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- View transactional email details (Read)

- Send transactional emails (Write)

## Transactional Email Object

The transactional email object contains the following fields:

  
    
      Field
      Description
    
  
  
    
      `id`
      The unique identifier of the transactional email
    
    
      `recipient_email`
      The email address of the recipient
    
    
      `recipient_name`
      The name of the recipient (optional)
    
    
      `subject`
      The subject line of the email
    
    
      `body`
      The content of the email
    
    
      `preheader`
      Preview text that appears in email clients
    
    
      `queue_at`
      The scheduled time for sending the email
    
    
      `sent_at`
      The time when the email was sent
    
    
      `created_at`
      The time when the record was created
    
    
      `updated_at`
      The time when the record was last updated
    
    
      `status_url`
      URL to check the status of this transactional email
    
  

## Send Transactional Email

```
POST /api/v1/transactionals.json

```

### Parameters

- `to` (required): Email address of the recipient

- `subject` (required): Subject line of the email

- `body` (required): Content of the email, which can be either a simple string or HTML. In either case, Broadcast will wrap the content in the appropriate html and body tags. If you want to incorporate an entire HTML design, just send the contents within the body tag.

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "to": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
    "subject": "Welcome to Our Service",
    "body": "Thank you for signing up!"
  }' \
  https://your-broadcast-domain.com/api/v1/transactionals.json

```

### Response

```
{
  "id": "123",
  "recipient_email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "recipient_name": "John Doe",
  "subject": "Welcome to Our Service",
  "body": "Thank you for signing up!",
  "preheader": "Welcome to our amazing service",
  "queue_at": "2024-03-21T10:00:00Z",
  "sent_at": null,
  "created_at": "2024-03-21T09:00:00Z",
  "updated_at": "2024-03-21T09:00:00Z",
  "status_url": "https://your-broadcast-domain.com/api/v1/transactionals/123.json"
}

```

If the request is invalid, the response code will be 422 (Unprocessable Entity). The error message will be returned in the response body:

```
{
  "errors": {
    "recipient_email": ["can't be blank"],
    "subject": ["can't be blank"],
    "body": ["can't be blank"]
  }
}

```

## Get Transactional Email Details

```
GET /api/v1/transactionals/:id.json

```

### Parameters

- `id` (required): The ID of the transactional email

### Request

```
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://your-broadcast-domain.com/api/v1/transactionals/123.json

```

### Response

```
{
  "id": "123",
  "recipient_email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "recipient_name": "John Doe",
  "subject": "Welcome to Our Service",
  "body": "Thank you for signing up!",
  "preheader": "Welcome to our amazing service",
  "queue_at": "2024-03-21T10:00:00Z",
  "sent_at": null,
  "created_at": "2024-03-21T09:00:00Z",
  "updated_at": "2024-03-21T09:00:00Z",
  "status_url": "https://your-broadcast-domain.com/api/v1/transactionals/123.json"
}

```

## Notes

- When sending a transactional email, if no specific queue time is provided, the email will be queued immediately.

- If the recipient&rsquo;s email matches an existing subscriber in your database, the transactional email will be automatically associated with that subscriber&rsquo;s record.

- All API requests must include a valid API token with the appropriate permissions in the Authorization header.

---

## API Sequences

*Source: https://sendbroadcast.net/docs/api-sequences*

# Sequences API

The Sequences API allows you to add and remove subscribers within sequences programmatically, as well as list current subscribers in a sequence.

This API endpoint is not for modifying or creating sequences themselves. This must be done within Broadcast&rsquo;s user interface.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- List and read subscribers in sequences (Read)

- Add or remove subscribers from sequences (Write)

## Subscriber Sequence Object

  
    
      Field
      Description
    
  
  
    
      `id`
      Unique identifier of the subscriber sequence
    
    
      `status`
      Current status of the sequence subscription
    
    
      `started_at`
      When the subscriber was added to the sequence
    
    
      `completed_at`
      When the subscriber completed or was removed from the sequence
    
    
      `next_trigger_at`
      When the next email in the sequence will be sent
    
    
      `subscriber`
      Information about the subscriber
    
    
      `subscriber.id`
      Unique identifier of the subscriber
    
    
      `subscriber.email`
      Email address of the subscriber
    
  

## Endpoints

Important: For the following endpoints, you will need the `id` of the sequence. You can find this in the URL of the sequence in the user interface.

For example, if your sequence URL is `https://broadcast.example.com/sequences/6`, then the `id` would be `6`.

### List Subscribers in a Sequence

```
GET /api/v1/sequences/:id/list_subscribers.json?page=1

```

Returns a paginated list of subscribers in the specified sequence.

### Parameters

- `id` (required): The ID of the sequence in the URL

- `page`: The page number to return (default is 1)

### Response

```
{
  "subscriber_sequences": [
    {
      "id": "123",
      "status": "active",
      "started_at": "2024-03-20T10:00:00Z",
      "completed_at": null,
      "next_trigger_at": "2024-03-21T10:00:00Z",
      "subscriber": {
        "id": "456",
        "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
      }
    }
  ],
  "pagination": {
    "prev": null,
    "next": 2,
    "count": 95,
    "pages": 10,
    "page": 1
  }
}

```

## Add Subscriber to Sequence

Note that this endpoint will try and add an existing subscriber to the sequence based on the email address.

If the subscriber email does not exist in the system, the subscriber will be created along with adding them to the sequence.

```
POST /api/v1/sequences/:id/add_subscriber.json

```

Adds a subscriber to the specified sequence.

### Parameters

- `id` (required): The ID of the sequence in the URL

And the following parameters under the &ldquo;subscriber&rdquo; key:

- `email` (required): The email address of the subscriber

- `first_name`: The first name of the subscriber

- `last_name`: The last name of the subscriber

### Request

```
curl -X POST 'https://your-broadcast-domain.com/api/v1/sequences/123/add_subscriber.json' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subscriber": {
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
      "first_name": "John",
      "last_name": "Doe"
    }
  }'

```

### Response

Returns `201 Created` on success or `422 Unprocessable Entity` if the request fails.

## Remove Subscriber from Sequence

```
DELETE /api/v1/sequences/:id/remove_subscriber

```

Removes a subscriber from the specified sequence.

### Parameters

- `id` (required): The ID of the sequence in the URL

And the following parameters under the &ldquo;subscriber&rdquo; key:

- `email` (required): The email address of the subscriber

### Request

```
curl -X DELETE 'https://your-broadcast-domain.com/api/v1/sequences/123/remove_subscriber' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subscriber": {
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
    }
  }'

```

### Response

Returns `200 OK` on success or `422 Unprocessable Entity` if the request fails.

---

