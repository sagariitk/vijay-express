function validateloginform(){  
    var username=document.loginform.username.value;  
    var password=document.loginform.password.value; 
    if (username==null || username==""){  
    alert("UserName can't be blank"); 
    return false; 
    } 
    // return true;
}