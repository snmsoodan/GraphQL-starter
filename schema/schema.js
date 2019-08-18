const graphql = require('graphql');
// const _ = require('lodash');
const axios = require('axios');

const {
    GraphQLObjectType, 
    GraphQLString,
    GraphQLInt, 
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull
} = graphql;

//mock data
// const users = [
//     {
//         id:'23',
//         firstName:'Bill',
//         age:20
//     },
//     {
//         id:'47',
//         firstName:'Samantha',
//         age:21
//     }
// ]

const CompanyType = new  GraphQLObjectType({
    name: 'Company',
    fields: () =>({
        id: {type: GraphQLString},
        name: {type: GraphQLString},
        description: {type: GraphQLString},
        users: {
            type: new GraphQLList(UserType),
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
                .then(res => res.data);
            }
        }
    })
})

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: {type: GraphQLString},
        firstName: {type: GraphQLString},
        age: {type: GraphQLInt} ,
        company: {
            type: CompanyType,      //user is only associated with one company
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
                .then(res => res.data);
            }
        }
    })
});

//first step in graphql to find the user with a given Id
const RootQuery = new GraphQLObjectType({
    name: 'RootQUeryType',
    fields: {
        user: {
            type: UserType,
            args: {id: {type: GraphQLString}},
            resolve(parentValue, args) {
                // return _.find(users, {id: args.id});
                return axios.get(`http://localhost:3000/users/${args.id}`)
                .then(response => response.data);
            }
        },
        company: {
            type: CompanyType,
            args: {id: {type: GraphQLString}},
            resolve(parentValue,args) {
                return axios.get(`http://localhost:3000/companies/${args.id}`)
                .then(res => res.data);
            }
        }
    }
});

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type:  UserType,
            args: {
                firstName: {type: new GraphQLNonNull(GraphQLString)},
                age: {type: new GraphQLNonNull(GraphQLInt)},
                companyId: {type: GraphQLString}
            },
            // resolve(parentValue, args) {
            resolve(parentValue, args) {
                return axios.post(`http://localhost:3000/users`,args) //companyId not optional value not inserted
                .then(res => res.data);                               //update: we can drop the args object
            }                                                                     
        },
        deleteUser: {
            type: UserType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)}
            },
            resolve(parentValue, {id}) {
                return axios.delete(`http://localhost:3000/users/${id}`)
                .then(res => res.data);
            }
        },
        editUser: {
            type: UserType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)},
                firstName: {type: GraphQLString},    //again not sure how to have optional fields
                age: {type: GraphQLInt},             //update: drop the args object within the request
                companyId: {type: GraphQLString}
            },
            resolve(parentValue, args) {
                return axios.patch(`http://localhost:3000/users/${args.id}`, args)
                .then(res => res.data);
            }
        }
    }
})

module.exports= new GraphQLSchema({
    query: RootQuery,
    mutation
});