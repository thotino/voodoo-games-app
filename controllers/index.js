/* eslint-disable max-len */
const axios = require('axios')
const lodash = require('lodash')
const { Op } = require('sequelize')
const config = require('../config')
const db = require('../models');

/**
 * This function returns all existing entities to client
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const retrieveGames = async (req, res) => {
    try {
      const games = await db.Game.findAll()
      return res.send(games)
    } catch (err) {
      console.error('There was an error querying games', err);
      return res.send(err);
    }
  }

/**
 * This function inserts a new entity to database
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createGame = async (req, res) => {
    const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
    const transaction = await db.sequelize.transaction()
    try {
      const game = await db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished }, { transaction })
      await transaction.commit()
      return res.send(game)
    } catch (err) {
      await transaction.rollback()
      console.error('***There was an error creating a game', err);
      return res.status(400).send(err);
    }
  }

/**
 * This function removes an existing entity from the database
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const deleteGame = async (req, res) => {
    try {
      const game = await db.Game.findByPk(parseInt(req.params.id))
      await game.destroy({ force: true })
      return res.send({ id: game.id  })
    } catch (err) {
      console.error('***Error deleting game', err);
      return res.status(400).send(err);
    }
  }

/**
 * This function updates an existing entity in the database with given parameters
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateGame = async (req, res) => {
    // eslint-disable-next-line radix
    const id = parseInt(req.params.id);
    const transaction = await db.sequelize.transaction()
    const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
    try {
      const game = await db.Game.findByPk(id)
      await game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished }, transaction)
      await transaction.commit()
      return res.send(game)
    } catch (err) {
      await transaction.rollback()
      console.error('***Error updating game', err);
      return res.status(400).send(err);
    }
  }

/**
 * This function searches for entities with the given criteria
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const searchGames = async (req, res) => {
    const { name = null, platform = null } = req.body
    try {
      console.log(`name: ${name}, platform: ${platform}`)
      // No search specified case
      if (!name || !platform) {
        const allGames = await db.Game.findAll()
        return res.send(allGames)
      }
      // Search the entities that match the platform
      const games = await db.Game.findAll({ where: { [Op.and]: [{ platform }, { name: { [Op.like]: `%${name}%` } }] } })
      return res.send(games)
    } catch (error) {
      console.error('***Error searching games', error);
      return res.status(400).send(error);
    }  
  }

/**
 * This function populate the database with retrieved data from S3
 * @param {*} req 
 * @param {*} res 
 * @todo - use a message boker for this kind of request
 * @todo - retrieve the S3 file as a readable stream
 * @returns 
 */
const populateGames = async (req, res) => {
  const transaction = await db.sequelize.transaction()
    try {
      // TO DO: Use a message broker for this kind of request
      // Loop over the platforms
      for ( const [curentPlatform, bucketPath] of Object.entries(config.topGamesBuckets) ) {
        console.log(`Platform: ${curentPlatform}, Bucket: ${bucketPath}`)
        // Get the distant data from S3
        // We could also get the data as a readable stream object to read it in a continuous manner
        // It will avoid memory leak
        const { data: topGamesJSON } = await axios({
          url: bucketPath,
        })
        if (!topGamesJSON || !topGamesJSON.length) throw 'ERR_NO_DATA_FOUND'
        // Loop over the data
        for ( const topGames of topGamesJSON ) {
          for (const topGame of topGames) {
            if (!topGame || lodash.isEmpty(topGame)) continue
            // Destructure every object
            const { publisher_id: publisherId, name, os: platform, bundle_id: bundleId, version: appVersion, appId: storeId } = topGame
            // Build our database entry
            const gameEntry = { publisherId, name, platform, bundleId, appVersion, storeId, isPublished: true }
            console.log(gameEntry)
            // Create the entry
            await db.Game.findOrCreate({ where: { ...gameEntry }, defaults: { ...gameEntry }, transaction })
          }
          
        }
      }
      await transaction.commit()
      return res.send({ updated: true })
    } catch (error) {
      await transaction.rollback()
      console.error('***Error populating database', error);
      return res.status(400).send(error);
    }  
  }

module.exports = { createGame, retrieveGames, updateGame, deleteGame, searchGames, populateGames }