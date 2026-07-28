# `@repo/windmill`

The dynamic email compilation and delivery helper library for the Scryme platform. It couples [Nodemailer](https://nodemailer.com/) engines with [Handlebars](https://handlebarsjs.com/) template systems to provide structured HTML templates.

## 🚀 Key Features

- **Email Template Compilers**: Converts standard template files located inside `src/templates` into modern, fluid HTML bodies.
- **Handlebars Dynamic Layouts**: Easily customize values (e.g. user details, invoice totals, or payment tokens) securely inside standard layouts.
- **Database Decoupled**: Functions independently of transactional database contexts to enable robust, isolated background worker queues.
