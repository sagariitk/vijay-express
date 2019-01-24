function validatecontactform(){  
    var name=document.contactform.name.value;  
    var email=document.contactform.email.value; 
    if (name==null || name==""){  
    alert("Name can't be blank"); 
    return false; 
    } 
    else if(email==null || email==""){  
    alert("email can't be blank"); 
    return false; 
    } 
}