const { REST, Routes} = require('discord.js');
// command list
const commands = [
	{
	  name: 'putupforbattle',
	  description: 'Put a card up for battle',
	},
	{
	  name: 'removefrombattle',
	  description: 'Remove a card from battle',
	  options: [
		{
		  name: 'cardid',
		  description: 'The ID of the card to remove',
		  type: 3, // STRING
		  required: true,
		},
	  ],
	},
  ];

// command initialization
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands('1238935048737263746'),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();