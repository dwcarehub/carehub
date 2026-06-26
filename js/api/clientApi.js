const ClientAPI={

async getClients(){

const {data,error}=await supabase

.from("고객_Master")

.select("*")

.order("고객명");

if(error){

return{

status:"error",

message:error.message

};

}

return{

status:"success",

data:{

clients:data

}

};

}

};
