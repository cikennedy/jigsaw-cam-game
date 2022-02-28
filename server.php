<?php

$db_host="localhost";
$db_user="root";
$db_password="";
// if link not established, we warn that the connection failed 
if(!$lnk)
    // die function terminates php code 
    die("Database connection failed");

mysqli_select_db($lnk, "puzzlecam") or die ("failed to select DB");

// scores for each difficulty level using their difficulty as a parameter of the function 
$easy=getScoresWithDifficulty("Easy", $lnk);
print_r($easy);
$medium=getScoresWithDifficulty("Medium", $lnk);
print_r($medium);
$hard=getScoresWithDifficulty("Hard", $lnk);
print_r($hard);
$impossible=getScoresWithDifficulty("Impossible", $lnk);
print_r($impossible);

// select entries from scorer's table by difficulty
// . is used for concatanation in php
function getScoresWithDifficulty($difficulty){
    $query="Select Name, Time FROM Scores". 
        " WHERE Difficulty Like 'Easy'".
        " ORDER BY Time";

    // execute the query using the mysqli_query function
    // this function doesn't actually return the result, 
    // but an object that we can use to iterate through the reults
    $rs=mysqli_query($lnk,$query);

    // we first initialize an empty array
    $results=array();
    // then if the result contains any rows, we use a while loop 
    // to fetch each row one by one using the mysqli_fetch_assoc function on the rs object
    if(mysqli_num_rows($rs)>0){
        while($row=mysqli_fetch_assoc($rs)){
            // we add each row to the results array using the array_push function
            array_push($results,$row);
        }
    }

    return $results;
}
?>