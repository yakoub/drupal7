<?php 
$elements = element_children($form);
hide($form['actions']);
hide($form['additional_settings']);
?>
<div class="two-columns">
  <div class="first">
    <?php 
      while ($key = next($elements)) :
        print drupal_render($form[$key]);
        if ($key == 'body') {
          break;
        }
      endwhile;
    ?>
  </div>
  <div class="second">
    <?php
      while ($key = next($elements)) :
        print drupal_render($form[$key]);
      endwhile;
    ?>
  </div>
  <div class="bottom">
    <?php print render($form['actions']); ?>
    <?php print render($form['additional_settings']); ?>
    <?php print drupal_render_children($form); ?>
  </div>
</div>
