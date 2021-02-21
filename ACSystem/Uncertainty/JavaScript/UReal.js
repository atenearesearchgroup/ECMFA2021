class UReal{

    constructor(x, u){
        this.x = x;
        this.u = u;

        if(this.x == undefined){
            this.x = 0.0;
        }
        if(this.u == undefined){
            this.u = 0.0;
        }
    } 

    setX(x){
        this.x = x;
    }

    getX(){
        return this.x;
    }

    setU(u){
        this.u = u;
    }

    getU(){
        return this.u;
    }
       
    /*********
     * 
     * Type Operations
     */

    add(r){
        var result = new UReal();
        result.setX(this.getX() + r.getX());
        result.setU(Math.sqrt((this.getU() * this.getU()) + (r.getU() * r.getU()) ));
        return result;
    }

    minus(r){
       var result = new UReal();
        result.setX(this.getX() - r.getX());
        if (r==this) result.setU(0.0);
        else result.setU(Math.sqrt((this.getU()*this.getU()) + (r.getU()*r.getU())));
        return result;
    }

    mult(r){
        var result = new UReal();
        result.setX(this.getX() * r.getX());

//		if (this.getU()==0.0) { result.setU(r.getU() * this.getX()); }
//		else if (r.getU()==0.0) {result.setU(this.getU()*r.getX()); }
//			 else {
		var a = r.getX()*r.getX()*this.getU()*this.getU();
		var b = this.getX()*this.getX()*r.getU()*r.getU();
		result.setU(Math.sqrt(a + b));
//			 }	
		return result;
    }

    divideBy(r){
        var result = new UReal();

        if (r==this) { // pathological cases x/x
			result.setX(1.0);
			result.setU(0.0);
			return result;
		}
		if (r.getU()==0.0) { // r is a scalar
			result.setX(this.getX() / r.getX());
			result.setU(this.getU()/r.getX()); // "this" may be a scalar, too
			return result;
		}
		if (this.getU()==0.0) { // "this is a scalar, r is not
			result.setX(this.getX() / r.getX());
			result.setU(r.getU()/(r.getX()*r.getX()));
			return result;
        }
        // both variables have associated uncertainty

        var a = this.getX() / r.getX();
        var b = 0.0

        var c =((this.getU()*this.getU())/Math.abs(r.getX()));
        var d = Math.abs((this.getX()*this.getX()*r.getU()*r.getU()) / (r.getX()*r.getX()*r.getX()*r.getX()));
        result.setU(Math.sqrt(c + d));

        return result;
    }

    abs(){
        var result = new UReal();
        result.setX(Math.abs(this.getX()));
		result.setU(this.getU());
		return result;
    }

    neg(){
        var result = new UReal();
        result.setX(-this.getX());
		result.setU(this.getU());
		return result;
    }

    power(s){
        var result = new UReal();
        var a = Math.pow(this.getX(), s);
        var b = ((s*(s-1))/2) * (Math.pow(this.getX(), s-2)) * (this.getU()*this.getU());
        result.setX(a);
        var c = s * this.getU() * (Math.pow(this.getX(), s-1));
        result.setU(c);

        return result;
    }

    sqrt(){
        var result = new UReal();
		if (this.getX()==0.0 && this.getU()==0.0) {
			result.setX(0.0);
			result.setU(0.0);
		}
		else {
			var a = Math.sqrt(this.getX());
			var b = 0.0; //(this.getU()*this.getU()) / ((8)*Math.pow(this.getX(), 3/2));
			var c = (this.getU()) / (2*Math.sqrt(this.getX()));
			result.setX(a - b);
			result.setU(c);
		}
		return result;
    }

    sin(){
        var result = new UReal();
        result.setX(Math.sin(this.getX()));
        result.setU(this.getU()*Math.cos(this.getX()));
        return result;
    }

    cos(){
        var result = new UReal();
        result.setX(Math.cos(this.getX()));
        result.setU(this.getU()*Math.sin(this.getX()));
        return result;
    }
    
    tan(){
        return this.sin().divideBy(this.cos()); 
    }

    acos(){
        var result = new UReal();
        result.setX(Math.acos(this.getX()));
        if (Math.abs(this.getX())!=1.0) result.setU(this.getU()/Math.sqrt((1 - this.getX()*this.getX())));
        else result.setU(this.getU());
        return result;
    }

    asin(){
        var result = new UReal();
        result.setX(Math.asin(this.getX()));
        if (Math.abs(this.getX())!=1.0) result.setU(this.getU()/Math.sqrt((1 - this.getX()*this.getX())));
        else result.setU(this.getU());
        return result;
    }

    inverse(){//inverse (reciprocal)
        return new UReal(1.0, 0.0).divideBy(this);
    }

    floor() { //returns (i,u) with i the largest int such that (i,u)<=(x,u)
		return new UReal(Math.floor(this.getX()),this.getU());
	}

	round(){ //returns (i,u) with i the closest int to x
		return new UReal(Math.round(this.getX()),this.getU());
	}

     /*********
     * 
     * Type Operations with correlated variables
     */

     addCovariance(r, covariance){
         var result = new UReal();

     }

     minusCovariance(r, covariance){
        var result = new UReal();
		result.setX(this.getX() - r.getX());
		if (r==this) result.setU(0.0);
		else result.setU(Math.sqrt((this.getU()*this.getU()) + (r.getU()*r.getU() - 2 * covariance)));
		return result;
	
     }

     multCovariance(r, covariance){
        var result = new UReal();
		
		result.setX(this.getX() * r.getX());
		var a = r.getX()*r.getX()*this.getU()*this.getU();
		var b = this.getX()*this.getX()*r.getU()*r.getU();
		var c = 2 * this.getX() * r.getX() * covariance;
		result.setU(Math.sqrt(a + b + c));
		return result;
     }

     divideByCovariance(r, covariance){
        var result = new UReal();
	
		if (r==this) { // pathological cases x/x. Covariance should be 1!
			result.setX(1.0);
			result.setU(0.0);
			return result;
		}
		if (r.getU()==0.0) { // r is a scalar
			result.setX(this.getX() / r.getX());
			result.setU(this.getU() / r.getX()); // "this" may be a scalar, too
			return result;
		}
		if (this.getU()==0.0) { // "this is a scalar, r is not
			result.setX(this.getX() / r.getX());
			result.setU(this.getU()/(this.getX()*this.getX()));
			return result;
		}
		// both variables have associated uncertainty

		var a = this.getX() / r.getX();
//		var b = (this.getX()*r.getU()*r.getU())/(Math.pow(r.getX(), 3));
		var b = 0.0; //(this.getX()*r.getU()*r.getU())/(r.getX()*r.getX()*r.getX());
		result.setX(a + b);
		
		var c = ((this.getU()*this.getU())/Math.abs(r.getX()));
//		var d = (this.getX()*this.getX()*r.getU()*r.getU()) / Math.pow(r.getX(), 4);
		var d = (this.getX()*this.getX()*r.getU()*r.getU()) / (r.getX()*r.getX()*r.getX()*r.getX());
		var e = Math.abs((this.getX()*covariance)/(r.getX()*r.getX()*r.getX()));
		result.setU(Math.sqrt(c + d - e));
		
		return result;

     }

     /***
	 * comparison operations
	 * 	These operations, that return a boolean, have been superseded by the
	 * corresponding UBoolean-returning operations -- except equals() and
	 * distinct, since they have another meaning in Java!.
     */
//	public boolean lt(UReal number) {
//		// we compute the separation factor of the two distributions considered as a mixture
//		// see http://faculty.washington.edu/tamre/IsHumanHeightBimodal.pdf
	//		double s1 = this.getU();
	//	double s2 = number.getU();
	//	// non-UReal cases first
	//	if ((s1==0.0) || (s2==0.0)) 
	//		return (this.getX() < number.getX());
	//	// if both numbers have some uncertainty
	//	double r = (s1*s1)/(s2*s2);
	//	double S = Math.sqrt(-2.0 + 3*r + 3*r*r - 2*r*r*r + 2*Math.pow(1-r+r*r, 1.5) )/(Math.sqrt(r)*(1+Math.sqrt(r)));
	//	double separation =  S*(s1+s2);
	//	if (Double.isNaN(S)) // similar to s1==0 or s2==0. No way to compute the separation test 
	//		return (this.getX() < number.getX());
	//	double diff = number.getX() - this.getX();
	//	return  (diff > 0) && (diff > separation); // they are distinguishable
	//	/** previous implementation
	//	  boolean result = false;
	//	   result = (this.getX() < number.getX()) &&
	//      ((this.getX() + this.getU())  < (number.getX() - number.getU()));
	//	   return result; */
	//	}
	
//	public boolean le(UReal r) {
	//		return (this.lt(r) || this.equals(r));
	//	}
	
	//	public boolean gt(UReal r) {
	//	return r.lt(this);
	//}
	//
	//
	//	public boolean ge(UReal r) {
	//		return (this.gt(r) || this.equals(r));
    //	}
    equals(number) {
		// we compute the separation factor of the two distributions considered as a mixture
		// see http://faculty.washington.edu/tamre/IsHumanHeightBimodal.pdf
		if (this == number) return true;
		
		var s1 = this.getU();
		var s2 = number.getU();
		// non-UReal cases first
		if ((s1==0)||(s2==0)) return this.getX() == number.getX();
		// if both numbers have some uncertainty
		var r = (s1*s1)/(s2*s2);
        var S = Math.sqrt(-2.0 + 3*r + 3*r*r - 2*r*r*r + 2*Math.pow(1-r+r*r, 1.5) )/(Math.sqrt(r)*(1+Math.sqrt(r)));

		if (isNaN(S)) // similar to s1==0 or s2==0. No way to compute the separation test 
			return (this.getX() == number.getX());
		var separation =  S*(s1+s2);
		return  Math.abs(number.getX() - this.getX()) <= separation; // they are indistinguishable
		/** previous implementation
		 * 
		boolean result = false;
		double a = Math.max((this.getX() - this.getU()), (r.getX() - r.getU()));
		double b = Math.min((this.getX() + this.getU()), (r.getX() + r.getU()));
		result = (a <= b);
		return result;
		 */
    }
    
    distinct(r){
        return !(this.equals(r));
    }

    	//	/***
	// * comparison operations WITH ZERO = UReal(0.0)
	// */
	//public boolean ltZero() {
	//	return this.lt(new UReal());
	//}
	//	
	//public boolean leZero() {
	//	return this.le(new UReal());
	//}
	//
	//public boolean gtZero() {
	//	return this.gt(new UReal());
	//}
	//	
	//public boolean geZero() {
	//	return this.ge(new UReal());
	//}
	//

    equalsZero(u) {
		return this.equals(new UReal(0.0,u));
	}
	
	distinctZero(u) {
		return this.distinct(new UReal(0.0,u));
    }
    
    //
	/*** 
	 *   FUZZY COMPARISON OPERATIONS
	 *   Assume UReal values (x,u) represent standard uncertainty values, i.e., they follow a Normal distribution
	 *   of mean x and standard deviation \sigma = u
	 */
	
	/**
	 * Let's start by some Gaussian operations
	// returns the cumulative normal distribution function (CNDF) for a standard normal: N(0,1)
    */

    CNDF(x) {
			// See http://stackoverflow.com/questions/442758/which-java-library-computes-the-cumulative-standard-normal-distribution-function
			// and https://lyle.smu.edu/~aleskovs/emis/sqc2/accuratecumnorm.pdf
	    var neg = (x < 0.0) ? 1 : 0;
	    if (neg == 1) 
	        x *= -1.0;
	    var k = (1.0 / ( 1.0 + 0.2316419 * x));
	    var y = (((( 1.330274429 * k - 1.821255978) * k + 1.781477937) *
	                   k - 0.356563782) * k + 0.319381530) * k;
	    y = 1.0 - 0.398942280401 * Math.exp(-0.5 * x * x) * y;
	    return (1.0 - neg) * y + neg * (1.0 - y);
    }
    
    /** alternative implementation -- they both work equally well
	
	private static double CNDF(double z) {
		if (z < -8.0) return 0.0;
		if (z >  8.0) return 1.0;
		double sum = 0.0, term = z;
		for (int i = 3; sum + term != sum; i += 2) {
			sum  = sum + term;
			term = term * z * z / i;
		}
		return 0.5 + sum * pdf(z);
	}
	*/
    // returns pdf(x) = standard Gaussian pdf
    pdf(x) {
        return Math.exp(-x*x / 2) / Math.sqrt(2 * Math.PI);

    
    }

    pdfMeanStddev(z, mu, sigma){
        return pdf((x - mu) / sigma) / sigma;
    }

    // return cdf(z, mu, sigma) = Gaussian cdf with mean mu and stddev sigma
    CNDF(z, mu, sigma) {
	    return CNDF((z - mu) / sigma);
	} 

    	// Compute z such that cdf(z) = y via bisection search
	// taken from http://introcs.cs.princeton.edu/java/22library/Gaussian.java.html
	inverseCNDF(y) {
	    return this.inverseCNDFBisection(y, 0.00000001, -8, 8);
	} 
    // bisection search
    inverseCNDFBisection(y, delta, lo, hi) {
        var mid = lo + (hi - lo) / 2;
        if (hi - lo < delta) return mid;
        if (CNDF(mid) > y) return this.inverseCNDFBisection(y, delta, lo, mid);
        else              return this.inverseCNDFBisection(y, delta, mid, hi);
    }

     /***
     * Now we start with the fuzzy functions
     */

    /** 
     * This method returns three numbers (lt, eq, gt) with the probabilities that 
     * lt: this < number, 
     * eq: this = number
     * gt: this > number
     */

    calculate(number) {
		var r = new Result();
		var m1, m2, s1, s2;
		var swap = false;
		if (this.getX()<=number.getX()) { // m1 is less or equal than m2
			m1 = this.getX();
			m2 = number.getX();
			s1 = this.getU();
			s2 = number.getU();
		} else {
			m2 = this.getX();
			m1 = number.getX();
			s2 = this.getU();
			s1 = number.getU();
			swap = true; // to return values in the correct order
		}
	
		if ((s1==0.0)&&(s2==0.0)) { //comparison between Real numbers
			if (m1==m2) {
				r.lt = 0.0; r.eq = 1.0;  r.gt = 0.0; 
				return r.check(swap); 
			}
			if (m1<m2) {
				r.lt = 1.0; r.eq = 0.0;  r.gt = 0.0; 
				return r.check(swap); 
			}
			r.lt = 0.0; r.eq = 0.0;  r.gt = 1.0; 
			return r.check(swap); 
		}
		if ((s1==0.0)) { // s1 is degenerated, s2 is not
			r.lt=1-CNDF(m1,m2,s2); r.eq=0.0;r.gt=CNDF(m1,m2,s2); 
			return r.check(swap); 
		}
		if ((s2==0.0)) { // s2 is degenerated, s1 is not
			r.lt=CNDF(m2,m1,s1); r.eq=0.0;r.gt=1-CNDF(m2,m1,s1); 
			return r.check(swap); 
		}
		// here none of the numbers are degenerated
		if (s1==s2) {
			var crossing = (m1 + m2)/2;
			r.lt = CNDF(crossing,m1,s1)-CNDF(crossing,m2,s2);
//			r.gt = 1-CNDF(crossing,m1,s1)-(1-CNDF(crossing,m2,s2));
//			r.eq = CNDF(crossing,m2,s2)+1.0-CNDF(crossing,m1,s1);
			r.gt = 0.0; //1-CNDF(crossing,m1,s1)-(1-CNDF(crossing,m2,s2));
			r.eq = 1.0 - (r.gt + r.lt); //CNDF(crossing,m2,s2)+1.0-CNDF(crossing,m1,s1); 
			return r.check(swap); 
		}
		else {
			var crossing1 = 
				-(-m2*s1*s1 + 
				   m1*s2*s2 +
				   s1*s2*Math.sqrt((m1-m2)*(m1-m2)-2.0*(s1*s1-s2*s2)*Math.log(s2/s1))
				 )/(s1*s1 - s2*s2);	
			var crossing2 = 
				(m2*s1*s1 - 
				 m1*s2*s2 +
				 s1*s2*Math.sqrt(((m1-m2)*(m1-m2)-2.0*(s1*s1-s2*s2)*Math.log(s2/s1))
				))/(s1*s1 - s2*s2);
			var c1 = Math.min(crossing1, crossing2);
			var c2 = Math.max(crossing1, crossing2);
//			System.out.println("crossing1 = "+c1);
//			System.out.println("crossing2 = "+c2);
			if (s1<s2) {
				r.gt = CNDF(c1,m2,s2)-CNDF(c1,m1,s1);//+CNDF(c2,m1,s1)-CNDF(c2,m2,s2);
				r.lt = 1.0-CNDF(c2,m2,s2)-(1.0-CNDF(c2,m1,s1));
				r.eq = CNDF(c1,m1,s1) + (1.0-CNDF(c2,m1,s1))
					 + CNDF(c2,m2,s2) - CNDF(c1,m2,s2);
			}
			else{
				r.lt = CNDF(c1,m1,s1)-CNDF(c1,m2,s2);//+CNDF(c2,m2,s2)-CNDF(c2,m1,s1);
				r.gt = 1.0-CNDF(c2,m1,s1)-(1.0-CNDF(c2,m2,s2));
				r.eq = CNDF(c1,m2,s2) + (1.0-CNDF(c2,m2,s2))
						 + CNDF(c2,m1,s1) - CNDF(c1,m1,s1);
			}
			return r.check(swap); 
		}		
    }
    

    uEquals(number) {
		var r = this.calculate(number);
		return new UBoolean(true,r.eq);
	}

	uDistinct(r) {
		return this.uEquals(r).not();
	}

	lt(number) {
		var r = this.calculate(number);
		return new UBoolean(true,r.lt);
	}
	
	le(number) {
		var r = this.calculate(number);
		return new UBoolean(true, r.lt+r.eq);
	}

	gt(number) {
		var r = this.calculate(number);
		return new UBoolean (true, r.gt);
	}

	
	ge(number) {
		var r = this.calculate(number);
		return new UBoolean(true,r.gt+r.eq);
    }
    
    	/*** 
	 *   END OF FUZZY COMPARISON OPERATIONS
	 */


	/*** 
	 *   FUZZY COMPARISON OPERATIONS WITH ZERO=UReal(0.0,0.0)
	 *   Assume UReal values (x,u) represent standard uncertainty values, i.e., they follow a Normal distribution
	 *   of mean x and standard deviation \sigma = u
	 */

    uEqualsZero(u) {
		return this.uEquals(new UReal(0.0,u));
	}

	uDistinctZero(u) {
		return this.uDistinct(new UReal(0.0,u));
	}

	ltZero() {
		return this.lt(new UReal());
	}
	
	leZero() {
		return this.le(new UReal());
	}

	gtZero() {
		return this.gt(new UReal());
	}

	geZero() {
		return this.ge(new UReal());
	}
    
	/*** 
	 *   END OF FUZZY COMPARISON OPERATIONS WITH ZERO
	 */

    
	compareTo(other) {
		if (this.equals(other)) return 0;
		if (this.lt(other).toBoolean()) return -1;
		return 1;
	}

	min(r) {
		if (r.lt(this).toBoolean()) return new UReal(r.getX(),r.getU()); 
		return new UReal(this.getX(),this.getU());
	}
	max(r) {
		//if (r>this) r; else this;
		if (r.gt(this).toBoolean()) return new UReal(r.getX(),r.getU());
		return new UReal(this.getX(),this.getU());
    }
    
    	/******
	 * Conversions
	 */
	
	toString() {
		return "(" + this.x + "," + this.u + ")";
	}
	
	toInteger(){ //
		return Math.floor(this.getX());
	}
	
	toReal()  { 
		return this.getX();
	}
	/* TODO implement other UClasses
	toUInteger() {
		UInteger r = new UInteger();
		r.x=(int)Math.floor(this.getX());
		r.u=Math.sqrt((this.u*this.u)+(this.x-r.x)*(this.x-r.x));
		return r;
    }
    

	public UInteger toBestUInteger() {
		UInteger r = new UInteger();
		r.x=(int)Math.round(this.getX());
		r.u=Math.sqrt((this.u*this.u)+(this.x-r.x)*(this.x-r.x));
		return r;		
	}

	public UUnlimitedNatural toUUnlimitedNatural() {
		UUnlimitedNatural r = new UUnlimitedNatural();
		r.x=(int)Math.floor(this.getX());
		r.u=Math.sqrt((this.u*this.u)+(this.x-r.x)*(this.x-r.x));
		return r;
	}

	public UUnlimitedNatural toBestUUnlimitedNatural() {
		UUnlimitedNatural r = new UUnlimitedNatural();
		r.x=(int)Math.round(this.getX());
		r.u=Math.sqrt((this.u*this.u)+(this.x-r.x)*(this.x-r.x));
		return r;
	}
    */
	/**
	 * Other Methods 
	 */
 	hashcode(){ //required for equals()
		return Math.round(x);
	}

 	clone() {
		return new UReal(this.getX(),this.getU());
	}
}

module.exports = UReal