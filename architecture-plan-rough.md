# Voice of Care: Complete Project Context - rough idea of project architecture.

**Last Updated:** February 15, 2026  
**Project Type:** AWS Hackathon Submission  
**Team Focus:** Healthcare AI for Rural India

---

## 🎯 Project Overview

### **The Concept**
An offline-first Android app that replaces ASHA workers' manual paperwork with voice-based data collection, using AI to automatically generate government-compliant reports.

### **Target Users**
- **Primary:** ASHA (Accredited Social Health Activist) workers in rural India
- **Secondary:** Block Medical Officers, Health Department 

### **Value Proposition**
Transform spoken field notes into government-ready reports, reducing documentation time and accelerating payment cycles.

---

## 🔍 Problem Statement

### **Original Pitch**
"ASHA workers are the lifeline of rural healthcare in India. But right now, they are drowning in paperwork. After walking miles to visit patients, they often spend hours manually filling out complex registers just to report data and claim their pay."

### **Refined Problem (After Analysis)**
**Core Issue:** ASHA workers' incentive payments are delayed 2-3 months because manual data submission takes days and has errors, causing financial hardship for workers earning ₹2,000-7,000/month.

**Why This Matters:**
- Payment is tied to documented work
- Late documentation = late payment
- Workers are already overburdened (74+ tasks)
- Digital solutions have failed due to trust and workload issues

---

### Our solution will be 3 main things
1. Mobile App - react native
2. Web app - react.js
3. Backend - fastAPI
4. Style Guide used : (https://github.com/ux4g/ux4g-design-system-v1)
    - For Styling , We are going to use ux4g design system
        i. minified css https://cdn.ux4g.gov.in/UX4G@2.0.8/css/ux4g-min.css
        ii. minified js https://cdn.ux4g.gov.in/UX4G@2.0.8/js/ux4g.min.js
        iii. Strict Use this design system across mobile app and web app


### 1. Mobile app.

This will be a simple react native app that wilitl replace the register that ASHA workers have to carry to record various things. We want this app to be very user friendly, lightweight, should have ability to work in no network environment, should have multi lingual operation mode builtin. We want this app to work on lower end android devices. These are the initial screens that we are planning to have in our app.

1. Login Screen:
- Should have 2 input fields asha id and password for initial login.
- Post initial login she can login with something like mpin or bio metric
- There won't be a signup page since the creds will be set up by an admin or medical officer.
- If the ASHA worker is logging in for the first time. we need to sync or initialize the benificiery data in something like a local database. maybe be sqlite3


2. Dashboard:
- There will bottom navigation bar and it will have 3 buttons
    a. dashboard tab
        - This page should contain a clear CTA button that says start visit
        - Above the we are planning to have something like today's schedule. the completed visits will be marked completed and pending will be highlighted accordingly
    b. past visit tab
        - A simple list of all the visit that she did. 
        - A simple filter that can help her filter
            i. Last week
            ii. Last month
            iii. benificiery or some tracking id (eg. MCTS id)
        - A Clear sync visit records CTA. 
    c. profile tab
        - A basic information that will show first name, last name, asha id, email, phone number, address, profile photo.
        - A second card that shows her earnings this month / total earnings till now
        - WE ALSO NEED TO GIVE CHOOSE APP LANGUAGE TOGGLE. THIS IS A MULTI LINGUAL APP.  


1. On clicking start visit CTA:
    - Think of this as a complete flow or jorney.
    - First screen will be about selecting what kind of visit is this. for example it can be HBNC (Home based newborn care) / PNC (Post Natal care) / ANC (Antenatal care)
    - For now we are only planning to create flow for HBNC.
    - Once user select HBNC we will ask her to enter MCTS id (Mother Child tracking system id).
    - Once MCTS id is verified we will take her to day visted page. This page will have something like day 1 , day 3 , day 5 etc. The days on which visits completed will be highlighted appropiately
    - If she clicks on any next day we will start the question answering or data collection phase.
    - I am attaching more context on what kind of data we are collecting separately
    

The data collection phase:
    - This page is basically the most important section where real work of ASHA worker will happen. This will contain following parts
    - A progress bar at top indicating how many questions have been answered
    - A hirstory card this will contain information related to answers captured for this question in previous days.
    - Actual question along with a play button. This will run text to speech and output a voice reading the current question.
    - Answer input. This will be dependent on the type of question. certain questions will have a simple yes/no and a push to talk button. once the voice is captured she should be able to replay it and re record it as well.
    - There should also be a way to navigate through the question list. This can be as simple as left , right swipe gesture or something like question list hamburger icon.
    - We also need to find a way to display actions / suggestions. These are usually per question based.
    - Once the flow is completed. Show her a summary and ability to review question answers. Also add a reminder to sync this data to backend.

Data Sync Logic
    - Once the User clicks on sync CTA, Following thing need to happen
        i. Refer local in app database check all visits that are not synced. create a payload and hit the post request for syncing
        ii. If sync is successful, Mark all visits which are successfully synced as completed.
        iii. If sync is not successful, Display Error Message to retry sync or contact admin  



### THE BACKEND:
This will be common backend system that will be utilized by our Mobile app and Web app (admin dashboard). This will be a simple fastAPI based server. We will dockerize this and will be deploying it on ec2. For data storage we will use aws S3 buckets. For database we will use Postgres SQL. For processing the visit data generated by asha workers and generating a exports in goverment recognized formats will use LLMS currently planning to use claude sonnet 3.5 on aws bedrock. Now the mobile app will be multi lingual so to manage data we are planning to do something like english + 1 language. Basically all the data that have been captured will be stored in english and that specific language format. 


Collections:
The backend will the data model of the whole system.
1. Worker

Interface Worker {
    id : number // primary key
    first_name: string
    last_name :string
    phone_number :number
    aadhar_id : number
    email : string
    address : string
    worker_type : enum 
    worker_id : number
    meta_data : object
}
Worker is the type of user which is using the system.
Worker types include 
i.ASHA Worker
ii.Medical Officer
iii.Auxillary MidWife Worker / DAI (ANM)
iv.Auxillary anganwadi Worker (AAW)

2. Benificary 

Interface Benificary{
    id : number // primary key
    first_name: string
    last_name :string
    phone_number :number
    aadhar_id : number
    email : string
    address : string
    age: number
    weight : number 
    benificary_id : id
    aadhar_id : id 
    meta_data : object
    benificary_type : enum ["individual","child","mother-child"]

Benicary is the entity or Individual whose data is collected for health
records or Govt Benefits
Benificary Types include 
i.Individual
ii.Child
iii. Mother CHild Pair
}

3. Visits

Interface Visit {
    id : number // primary key
    visit_type : enum ["hbnc","anc","pnc"]
    visit_date_time: timestamp
    is_sync : Boolean
    assigned_asha_id : number
    template: template_id
    visit_data : object // visit data dump includes question answer and voice-data and transcripts
    meta_data :object
}

4.Sync Logs

Interface Sync_log{
    id : number // primary_key
    visit_id : number
    worker_id : number:
    collection_center_id : number
    date_time : timestamp
    status : enum ["completed","incomplete","failed"]
    meta_data : object
}

5.Question

Interface Question{
    id : number // primary
    input_type: string
    question : string
    input_transcript : string
    voice_recording_url : string // (s3 bucket or app storage path)
    answer: string
    action : string
}


6. Visit_Template

Interface Visit_Template {
    id : number
    template_type : enum ["hbnc","anc","pnc"]
    meta_data : object
    question_ids : string[] // all question part of this templates 
}

7. Collection Center 


Interface Collection_Center {
    id : number 
    name : string
    address : string
    meta_data : object
}

8. Compensation 

Interface Compensation {
    id : string
    status : enum
    amount: number
    worker_id : number
    collection_center_id : number
    meta_data : object
    approved_by_worker_id : number     
}


### Web App 
Web App is a interface used by admin and medical officers etc. to monitor the asha workers progress, to analyze the data collected by the workers and offer data exports in government recognized formats. 
There will be a chatbot which will help with retriveal and provide factbased data driven answers to questions.(Keep a plan ready for this but implementation will be done later)


Screens:

1. SignUp Screen
    - This is a Standard SignUp where the following fields need to be collected :
        firstname, lastname , address ,email id, phone number, aadhar id , worker type,
        collection_center_id ,profile photo ,password and confirm password
    - There will be 8 digit worker_id generated from the backend after signup. this     will be used for login

2. Login Screen
    - This is login screen to authenticate users created during signup. 
        There will be 2 input fields : Worker_id and password 
    -Forget Password will show message containing "Contact Admin: to reset password"   


3. Dashboard Screen
    - There will be multiple Cards in the dashboard Screen
        i. List of ASHA Workers.  This will also have basic pagination, filters, search,exports data button and once we click on any item. Their details should be opened in a details modal
        ii. List of Benificary.  This will also have basic pagination, filters, search,exports data button and once we click on any item. Their details should be opened in a details modal
        iii. List of Visits.  This will also have basic pagination, filters, search,exports data button and once we click on any item. Their details should be opened in a details modal
        iv. A graph showing number of visits happening each day. (Y-axis : No of Visits and X-axis : Date )
    - Bottom right corner. There will be floating chat button. On click , We will see a chat drawer on right side 
    - Left Side will have another navigation bar. This Bar will contain following links to following pages 
        i. Profile
        ii. Sync Log
        iii. Onboarding Flow for Workers 
        iv. Onboarding Flow for benificary
        v. Data Export Screen



4. Onboarding Screen for workers
    - This will be a simple Form to onboard workers. Refer Worker Collections Interface for more details


5. Onboarding Screen for benificary
    - This will be a simple Form to onboard Benificary. Refer Benificary Collections Interface for more details.

6. Visit Screen
    - This will also have basic pagination, filters, search,exports data button and once we click on any item. Their details should be opened in a details modal
    - On Click, Any item we will visualize data from visit collection interface.
    - All data collected by workers in the app while data collection phases will be displayed here.
    -