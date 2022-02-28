<?php

$db_host="localhost";
$db_user="root";
$db_password="";
// if link not established, we warn that the connection failed 
if(!$lnk)
    // die function terminates php code 
    die("Database connection failed");
echo "Database connection successful";

?>