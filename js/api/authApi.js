const AuthAPI = {

    async login(loginId,password){

        const {data,error}=await supabase
        .from("users")
        .select("*")
        .eq("login_id",loginId)
        .eq("password",password)
        .eq("status","사용")
        .single();

        if(error){

            return{
                status:"error",
                message:"아이디 또는 비밀번호가 올바르지 않습니다."
            };

        }

        return{

            status:"success",
            data:data

        };

    }

};
