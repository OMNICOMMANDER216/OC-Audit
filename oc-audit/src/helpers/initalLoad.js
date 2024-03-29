/* jshint esversion: 6 */

const axios = require('axios');
const Customer = require('mongoose').model('Customer');
const mailer = require('./mailService');

const initialLoad =  async function(array, customer) {
	customer.sitemap = [];
	
	let sitemap =  await array.map(async (el) => {
		let lastChange = "";
		let assets = [];

		const content = await axios.get( el.loc[0]+'/?format=json')
			.then(res => res.data)
			.then(data =>  {
				lastChange = data.collection.updatedOn;

				if(data.collection.typeName === "index") {
					assets = data.collection.collections.map(col => col.mainImage ? col.mainImage.assetUrl: null);
					return data.collection.collections.map(col => col.mainContent).join("<br><br>");
				} else if(data.collection.typeName === "page") {
					assets = data.collection.mainImage ? data.collection.mainImage.assetUrl : null;
					return data.mainContent;
				}
			});

		return {
			loc : el.loc[0],
			lastChange: lastChange,
			content: content,
			assets: assets
		}
		});
		
	Promise.all(sitemap).then(results => {
		customer.sitemap = results.filter(res => res.content);
        new Customer(customer).save().then((object) => {
			const html = `
				<h3>Congratulations, you are officially registered for OC SCAN! </
				<p><span style="text-transform="uppercase">${object.name}</span> has been registered </p>
				<p>Moving forward we will be keeping you posted on changes to your website</p>
				<p>Access Token: ${object.code}</p>
				<p> <a href="www.omnicommando.com/welcome"> Visit OC SCAN </a> </p>
			`;
			console.log(object.email);
			mailer(object.email, 'OC SCAN Registration', html);
		});
	});
}

module.exports =  initialLoad;