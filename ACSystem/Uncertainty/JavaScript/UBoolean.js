class UBoolean{

    constructor(b, c){
        
        this.b = b;
        this.c = c;

        if(this.b == undefined){
            this.b = true;
        }
        if(this.c == undefined){
            this.c = 0.0;
        }
    }
    /** Important: booleans are always kept in their canonical form
	 *  (b,c) with b=true and c=confidence that b=true
	 */

     setNormalForm(){
         if (!this.b){this.b = true; this.c=1-this.c;}
     }

     getB(){
         this.setNormalForm();
         return this.b;
     }

     getC(){
         this.setNormalForm();
         return this.c
     }


      /*********
     * 
     * Type Operations
     */

   /*
    * Not(u) = Not (b, c) = (b, 1-c) = (Not b, c)
    */

     not(){
         var result = new UBoolean(!this.getB(), this.getC());
         return result;
     }

     and(b){
         if (this==b) return new UBoolean(this.b & b.b, this.c);// x and x

         var result = new UBoolean(
//              this.getB() && b.getB(),
//		        this.getC() * b.getC() );
				this.b & b.b,
                this.c * b.c );
                
        return result;

     }

     or(b){
        if (this == b) return new UBoolean(this.b | b.b, this.c) // x or x
        var result = new UBoolean(
            //				this.getB() || b.getB(),
            //				this.getC() + b.getC() - (this.getC()*b.getC()) );
                            this.b | b.b,
                            this.c + b.c - (this.c*b.c) );
                    return result;

     }

     implies(b){
         if (this==b) return new UBoolean((!this.b) | b.b, this.c); // x implies x

         var result = new UBoolean(
            (!this.b) | b.b,
            (1-this.c) + b.c - ((1-this.c)*b.c) );
    return result;
//		return this.uNot().uOr(b);
     }

     equivalent(b){
         //return this.implies(b).and(b.implies(this))
         return this.xor(b).not();
     }

     xor(b){
         var result = new UBoolean(
             true,
             Math.abs(this.getC() - b.getC()) );

         return result;
     }

     uEquals(b){
         return this.equivalent(b);
     }

	/***
	 * comparison operations
	 */
    
     equals(o){
         if (this == o) return true;
         if (o ==null ||  typeof(this) != typeof(o)) return false;

         var uBoolean = o;

         if(this.getB() != uBoolean.getB()) return false;
         return (uBoolean.getC() == this.getC());
     }

     distinct(b){
         return !this.equals(b);
     }

     equalsC(b, confidence){
     //	UBoolean x = this.equivalent(b);
     //	return x.c >= confidence;
     return Math.abs(this.getC()-b.getC() <= (1-confidence));
     }

     
     /******
	 * Conversions
	 */

     toString(){
         var val = this.getB();
         var conf = this.getC();
         if(conf < 0.5) {
             val = !val;
             conf = 1-conf;
         }
         return "(" + val + ", " + config +")";
     }

     toBoolean(){
 //		return Double.compare(c, 0.5)>=0;
		return (c>=0.5); //this works because it is in canonical form
     }

	/**
	 * Other Methods 
	 */

     compareTo(other){
        var x = (this.c - other.c);
        if (x==0) return 0;
        if (x<0) return -1;
        return 1
        // return (this.c-other.c);
     }

     clone(){
         return new UBoolean(this.getB(), this.getC());
     }
}


module.exports = UBoolean