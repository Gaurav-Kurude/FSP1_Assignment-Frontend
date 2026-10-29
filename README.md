# Workasana 
Workasana is a task management application that helps users create and manage projects, assign tasks to team members, track task status, and organize work efficiently.

---
## Demo Link
[Live Demo](https://fsp-1-assignment-frontend-ten.vercel.app/)
---

## Quick Start
---
git clone https://github.com/Gaurav-Kurude/Workasana<br>
cd Workasana<br>
npm install<br>
npm run dev
---

## Technologies
- React JS
- React Router
- Node JS
- Express
- MongoDB
- Chart.JS
---

## Demo Video
Watch a walkthrough (3-5 minutes) of all the major features of this app:
[Loom Video](https://drive.google.com/file/d/1Rkx6sdguaTn8TVRRXbmP5BFxRS0WCD4a/view?usp=sharing)
---

## Features
**Authentication**
- User login and authentication using JWT.
- Password verification using bcrypt.

**Dashboard**
- View projects, tasks, and their status.
- Get an overview of ongoing work.

**Projects**
- Create and view projects.
- Manage project details.

**Teams**
- Create and view teams.
- Organize team members.

**Tasks**
- Create, view, update, and delete tasks.
- Assign tasks to team members.
- Update task status: To Do, In Progress, Completed, or Blocked.

**Tags**
- Create and manage tags.
- Organize tasks using tags.

**Task Filtering**
- Filter tasks by project, team, owner, tags, and status.

**Backend & Database**
- REST APIs built using Node.js and Express.js.
- MongoDB database with Mongoose for data management.
---

## ApI Reference

## **POST /auth/signup**<br>
Create user Id
Sample Request Body:<br>
```
{
  "name": "Test User",
  "email": "testuser123@example.com",
  "password": "Test@123456"
}
```
Sample Response Body:<br>
```
{
    "message": "User registered successfully.",
    "user": {
        "id": "6ae33c7ccc2252d6e37f7583",
        "name": "Test User",
        "email": "testuser123@example.com"
    }
}
```

## **POST /auth/login**<br>
User Login
Sample Request Body:<br>
```
{
"email": "testuser123@example.com",
"password": "Test@123456"
}
```
Sample Response Body:<br>
```
{
    "message": "Login successful.",
    "token": "your_jwt_token",
    "user": {
        "id": "6ae33c7ccc2252d6e37f7583",
        "name": "Test User",
        "email": "testuser123@example.com"
    }
}
```

## **GET /auth/me**<br>
Sample Request Body:<br>
No request body is required. Just click Send.
Sample Response Body:<br>
```
{
  "id": "user_id",
  "name": "Test User",
  "email": "testuser123@example.com"
}
```

## **POST /tasks**<br>
Create Task:<br>
Sample Request Body:<br>
```
{
  "name": "Design Homepage",
  "project": "6adee96e5438fc25b7dbb682",
  "team": "6adf3c6939326a2211a8c1fc",
  "owners": ["6adcb93d2d27114493140f3b"],
  "tags": ["6ab20dd4d56577baf8429ac9"],
  "timeToComplete": 5,
  "status": "To Do"
}
```
Sample Response Body:<br>
```
{
    "message": "Task created successfully.",
    "task": {
        "name": "Design Homepage",
        "project": "6adee96e5438fc25b7dbb682",
        "team": "6adf3c6939326a2211a8c1fc",
        "owners": [
            "6adcb93d2d27114493140f3b"
        ],
        "tags": [
            "6ab20dd4d56577baf8429ac9"
        ],
        "timeToComplete": 5,
        "status": "To Do",
        "dueDate": null,
        "_id": "6ae342569cefafa909104fe1",
        "createdAt": "2026-10-29T12:55:50.254Z",
        "updatedAt": "2026-10-29T12:55:50.255Z",
        "__v": 0
    }
}
```

## **GET /tasks**<br>
Get All Tasks<br>
Sample Req Body:<br>
No request body is required. Just click Send.
Sample Response Body:<br>
```
{
    "count": 13,
    "tasks": [
        {
            "_id": "6ae342569cefafa909104fe1",
            "name": "Design Homepage",
            "project": {
                "_id": "6adee96e5438fc25b7dbb682",
                "name": "CRUD Test Project"
            },
            "team": {
                "_id": "6adf3c6939326a2211a8c1fc",
                "name": "Technical HR"
            },
            "owners": [
                {
                    "_id": "6adcb93d2d27114493140f3b",
                    "name": "Gaurav Kurude",
                    "email": "gau@gmail.com"
                }
            ],
            "tags": [
                "6ab20dd4d56577baf8429ac9"
            ],
            "timeToComplete": 5,
            "status": "To Do",
            "dueDate": null,
            "createdAt": "2026-10-29T12:55:50.254Z",
            "updatedAt": "2026-10-29T12:55:50.255Z",
            "__v": 0
        },...]}
```

## **POST /tasks/:id**<br>
Update tasks
Sample Request Body:<br>
```
{
  "name": "Design Homepage - Updated",
  "project": "6ad9f3ccc7ab8e40c7713f5f",
  "team": "6adaf270a97541a3341c105d",
  "owners": ["6adf2b8f118f5270d9c10dff"],
  "tags": ["6ac39669171bd7a145e4756d"],
  "timeToComplete": 3,
  "status": "In Progress"
}
```
Sample Response Body:<br>
```
{
    "message": "Task updated successfully.",
    "task": {
        "_id": "6ae342569cefafa909104fe1",
        "name": "Design Homepage - Updated",
        "project": {
            "_id": "6ad9f3ccc7ab8e40c7713f5f",
            "name": "Website Redesign"
        },
        "team": {
            "_id": "6adaf270a97541a3341c105d",
            "name": "Customer Support"
        },
        "owners": [
            {
                "_id": "6adf2b8f118f5270d9c10dff",
                "name": "newUSer",
                "email": "new12@gmail.com"
            }
        ],
        "tags": [
            "6ac39669171bd7a145e4756d"
        ],
        "timeToComplete": 3,
        "status": "In Progress",
        "dueDate": null,
        "createdAt": "2026-10-29T12:55:50.254Z",
        "updatedAt": "2026-10-29T14:13:40.178Z",
        "__v": 1
    }
}
```

## **POST /projects/:id**<br>
Update project
Sample Request Body:<br>
```
{
  "name": "Website Redesign - Updated",
  "description": "Updated project for redesigning the company website."
}
```
Sample Response Body:<br>
```
{
    "message": "Project updated successfully.",
    "project": {
        "_id": "6adf37bc93fe1ec9e0bdc6e1",
        "name": "Website Redesign - Updated",
        "description": "Updated project for redesigning the company website.",
        "createdAt": "2026-10-26T11:21:32.446Z",
        "__v": 0
    }
}
```

## **DELETE /projects/:id**<br>
delete Project
Sample Request Body:<br>
No JSON body is usually required for a DELETE request. Leave the Body tab empty.
Sample Response Body:<br>
```
{
  "message": "Project deleted successfully"
}
```

---

## Contact
For bugs or feature request, please react out to gauravkurude.sitmech@gmail.com  