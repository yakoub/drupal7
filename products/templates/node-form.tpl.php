<?php $elements = element_children($form); ?>
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
        if (
          isset($form[$key]['#group']) or 
          $key == 'additional_settings' or
          $key == 'actions'
          ) {
          continue;
        }
        print drupal_render($form[$key]);
      endwhile;
    ?>
  </div>
  <div class="bottom">
    <?php print drupal_render($form['actions']); ?>
    <?php print drupal_render_children($form); ?>
  </div>
</div>
