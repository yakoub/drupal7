<?php
/*
 * list persons
 */
function firstentity_person_list(){
  $results = db_select('person','p')->fields('p')->execute();
  $persons = array();
  foreach( $results as $record ){
    $persons[ $record->person_id ] = $record;
  }
  // calling attach_load on array is more effiecient than inside the above loop
  field_attach_load( 'person' , $persons );
  $content = array();
  foreach( $persons as $person ){
    $content[] = array(
      '#markup' => l( $person->name , 'person/' . $person->person_id )
    );
    $content[] = field_attach_view( 'person' , $person , 'full' );
  }
  return $content;
}
/*
 * view a person
 */
function firstentity_person( $person ){
  $content[] = array(
    '#markup' => l( $person->name , 'person/' . $person->person_id )
  );
  $content[] = field_attach_view( 'person' , $person , 'full' );
  return $content;
}
/*
 * person administration
 */
function firstentity_person_admin($personality = NULL){
  if($personality){
    return drupal_get_form( 'firstentity_addperson' , $personality );
  }else{
    $rows = array();
    $rows[] = array( l( 'teacher' , 'admin/person/teacher' ) );
    $rows[] = array( l( 'student' , 'admin/person/student' ) );
    $header =  array( 'links' );
    $output = theme( 'table' , array('header' => $header , 'rows' => $rows) );
  }
  $content[] = array( '#markup' => $output );
  return $content;
}

/*
 * create a new person
 */
function firstentity_addperson($form,&$form_state,$personality){
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => 'name'
  );

  $person = new stdClass();
  $person->personality = $personality;
  $person->id = 0;

  $form['person'] = array(
    '#type' => 'value',
    '#value' => $person
  );
  // validations requires is element
  $form['personality'] = array(
    '#type' => 'value',
    '#value' => $personality
  );
  // attach form elements for attached fields
  field_attach_form( 'person' , $person , $form , $form_state );
  
  $form['actions'] = array('#type' => 'actions');
  $form['actions']['add'] = array(
    '#type' => 'submit',
    '#value' => 'add'
  );
  return $form;
}
function firstentity_addperson_validate( $form , &$form_state ){
  entity_form_field_validate( 'person' , $form , $form_state );
}
function firstentity_addperson_submit( $form , &$form_state ){
  $person = $form_state['values']['person'];
  $person->name = check_plain( $form_state['values']['name'] );
  drupal_write_record( 'person' , $person );
  entity_form_submit_build_entity( 'person' , $person , $form , $form_state );
  field_attach_submit( 'person' , $person , $form , $form_state );
  field_attach_insert( 'person' , $person );

  //personality has loader function so no threat for xss
  drupal_set_message( " new $person->personality got added " );
}

/*
 * edit an existing person
 */
function firstentity_person_edit($form,&$form_state,$person){
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => 'name',
    '#default_value' => $person->name
  );

  $form['person'] = array(
    '#type' => 'value',
    '#value' => $person
  );
  $form['personality'] = array(
    '#type' => 'value',
    '#value' => $person->personality
  );
  field_attach_form( 'person' , $person , $form , $form_state );

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['save'] = array(
    '#type' => 'submit',
    '#value' => 'save'
  );
  $form['actions']['delete'] = array(
    '#type' => 'submit',
    '#value' => 'delete',
    '#submit' => array('firstentity_person_edit_delete')
  );
  return $form;
}
function firstentity_person_edit_validate( $form , &$form_state ){
  entity_form_field_validate( 'person' , $form , $form_state );
}
function firstentity_person_edit_submit( $form , &$form_state ){
  $person = $form_state['values']['person'];
  $person->name = check_plain( $form_state['values']['name'] );
  drupal_write_record( 'person' , $person , array('person_id') );
  entity_form_submit_build_entity( 'person' , $person , $form , $form_state );
  field_attach_submit( 'person' , $person , $form , $form_state );
  field_attach_update( 'person' , $person );

  //personality has loader function so no threat for xss
  drupal_set_message( " the $person->personality got saved " );
  $form_state['redirect'] = 'person/' . $person->person_id;
}
function firstentity_person_edit_delete( $form , &$form_state ){
  $person = $form_state['values']['person'];
  field_attach_delete( 'person' , $person );
  db_delete('person')
    ->condition( 'person_id' , $person->person_id , '=' )
    ->execute();
  $form_state['redirect'] = 'person';
}
