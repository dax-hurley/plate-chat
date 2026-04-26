-- Copy workout-level rest onto each line, then remove template column.
ALTER TABLE `workout_template_items` ADD `restBetweenSetsSec` integer;

UPDATE `workout_template_items`
SET `restBetweenSetsSec` = (
  SELECT `t`.`restBetweenSetsSec`
  FROM `workout_templates` AS `t`
  WHERE `t`.`id` = `workout_template_items`.`templateId`
)
WHERE `restBetweenSetsSec` IS NULL;

ALTER TABLE `workout_templates` DROP COLUMN `restBetweenSetsSec`;
