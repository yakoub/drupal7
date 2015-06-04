<div id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix"<?php print $attributes; ?>>
  <?php 
    if(empty($node->ajax)):
      print render($content['field_english_name']);
    endif; 
  ?>
  <div class="sidebar-content">
    <?php
      print render($content['field_picture']);
      print render($content['field_active_period']);
      print render($content['field_social_structure']);
      print render($content['field_breading_area']);
    ?>
  </div>
  <div class="main-content">
    <?php
      print render($content['body']);
      print render($content['field_endangered_species']);
    ?>
  </div>
</div>
