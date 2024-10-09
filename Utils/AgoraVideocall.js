const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const generateAgoraToken = (channelName, uid) => {
  const APP_ID = process.env.AGORA_APP_ID;
  const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTs
  );

  return token;
};

module.exports = {
  generateAgoraToken,
};
