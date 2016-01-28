/** Represents a user of DropComix */
interface User {

    username: string;
}

/** Represents a viewer of DropComix */
class Viewer implements User {

    username: string;
    
}
/** Represents a viewer of DropComix */
class Artist implements User {

    username: string;

}

