import { throwIfMissing, sendPushNotification } from './utils.js';

import { Client, Users, Databases } from 'node-appwrite';

// Test Data with 11 Pro Simulator
// {"deviceToken":"deR53P4J8EfejYGytvEcPA:APA91bGsYbpHZewq6WuYPGrw2HhJvg9imL__2c0YSPFkKXRJSLklzYWlR9VP7-6LXoIKl47wjPn5YTE4BXKGWW3h1eZ9Fw_BS7nKqYnbOgk0i7d2sG31djhISxXgjErbcxqeijbqQjHZ", "message":"Hello World"}
// event trigger: databases.650750f16cd0c482bb83.collections.65075108a4025a4f5bd7

export default async ({ req, res, log, error }) => {
  try {
    log(req);
    log(req.body);
    // throwIfMissing(req.body, ['deviceToken', 'message']);
    // throwIfMissing(req.body.message, ['title', 'body']);
  } catch (err) {
    return res.json({ ok: false, error: err.message }, 400);
  }

  // Init SDK
  const client = new Client()
    .setEndpoint(process.env.APP_ENDPOINT)
    .setProject(process.env.APP_PROJECT)
    .setKey(process.env.API_KEY);

  const users = new Users(client);
  const db = new Databases(client);

  const prefs = await users.getPrefs(req.body.to);
  log(prefs);

  const userDoc = await db.getDocument(
    process.env.APP_DATABASE,
    process.env.USERS_COLLECTION,
    req.body.sender
  );
  log(userDoc);

  if (prefs['ios'] !== '') {
    log(`Sending message to device: ${req.body.to}`);

    try {
      const response = await sendPushNotification({
        notification: {
          title: userDoc.name,
          body: req.body.body,
        },
        data: {
          roomId: req.body.roomId.$id,
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'bingbong.aiff',
            },
          },
        },
        token: prefs['ios'],
      });
      log(`Successfully sent message: ${response}`);

      return res.json({ ok: true, messageId: response });
    } catch (e) {
      error(e);
      return res.json({ ok: false, error: 'Failed to send the message' }, 500);
    }
  } else {
    return res.json({ ok: false, error: 'User not found' }, 404);
  }
};
