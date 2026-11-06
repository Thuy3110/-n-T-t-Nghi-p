UPDATE `Assessment`
SET `cloRate` = `cloRate` / 20
WHERE `cloRate` IN (60, 80);
