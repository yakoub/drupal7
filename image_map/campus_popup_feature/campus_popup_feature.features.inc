<?php
/**
 * @file
 * campus_popup_feature.features.inc
 */

/**
 * Implements hook_node_info().
 */
function campus_popup_feature_node_info() {
  $items = array(
    'animal' => array(
      'name' => t('animal'),
      'base' => 'node_content',
      'description' => '',
      'has_title' => '1',
      'title_label' => t('Title'),
      'help' => '',
    ),
    'image_map' => array(
      'name' => t('image map'),
      'base' => 'node_content',
      'description' => '',
      'has_title' => '1',
      'title_label' => t('Title'),
      'help' => '',
    ),
  );
  drupal_alter('node_info', $items);
  return $items;
}
