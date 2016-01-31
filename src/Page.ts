/** Represents a page */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/>
 
import { Comic } from './Comic';
class Page {
	
	pageno:number; /** A page number */
	comic:Comic; /** Comic that holds this page */
	
	
	/** CONSTRUCTOR */ 
	/** Looks up page from database by pageno and comic */
	/** NOTE: Should only be called in Comic class */
	 constructor(pageno:string, comic:Comic){} /** stub */
	 
	/** GETTERS */
	getComic():Comic{
		return this.comic;
	}

	getPageno():number {
		return this.pageno;
	}

	
	
	
}
