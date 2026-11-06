UPDATE `Assessment`
SET `cloRate` = `cloRate` * 20
WHERE `cloRate` >= 0 AND `cloRate` <= 5;
