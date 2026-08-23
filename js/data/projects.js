/* The trail map's marks, one entry per place: at is { left, top } in percent, size the circle's width, ring which of the six drawn circles. A project takes title, text, field ('comp' or 'env', by subject not method), tags, year, url, github, pdf. `featured` is the handful mobile.html shows before "see all": four computational and two environmental. */

window.PLACES = [
  {
    place: 'San Francisco, USA',
    at: { left: 11.3, top: 41.5 },
    size: 4.6,
    projects: [
      {
        title: 'Taxi Trip Duration Prediction',
        featured: true,
        field: 'cs',
        year: '2026',
        tags: ['Machine Learning', 'Python', 'Quantile Regression'],
        text: "Build a LightGBM quantile regression model trained on NYC yellow taxi data that predicts trip duration as a confidence interval, achieving a median MAE of 0.8 minutes with 79.8% of trips falling inside the predicted range.",
        url: 'https://trip-duration.vercel.app/'
      },
      {
        title: 'Can Bacteria Increase CO2 Capture?',
        featured: true,
        field: 'env',
        year: '2026',
        tags: ['Research Proposal', 'Climate Science', 'Geochemistry'],
        text: "Proposed a field experiment testing whether inoculating basalt-amended Corn Belt soils with Bacillus mucilaginosus accelerates CO2 sequestration through the bacterium's coupled polysaccharide and carbonic anhydrase mechanisms.",
        pdf: 'material/projects/can_bcateria_increase_carbon_capture.pdf'
      },
      {
        title: 'How Glaciers Feed the Southern Ocean',
        field: 'env',
        year: '2026',
        tags: ['Earth Science', 'Research'],
        text: "Reviewed how glacial physical weathering produces bioavailable iron at 15 to 20 times interglacial levels and what increasing glacier retreat under climate change means for Southern Ocean phytoplankton productivity and carbon sequestration.",
        pdf: 'material/projects/how_glaciers_feed_the_southern_ocean.pdf'
      }
    ]
  },
  {
    place: 'Riga, Latvia',
    at: { left: 51.4, top: 29.9 },
    size: 4.2,
    projects: []
  },
  {
    place: 'Seoul, South Korea',
    at: { left: 78.2, top: 44 },
    size: 4.2,
    projects: [
      {
        title: 'DNA Sequence Family Tree Reconstruction',
        field: 'comp',
        year: '2025',
        tags: ['Python', 'Algorithm Analysis'],
        text: 'Compares a greedy heuristic and a brute-force tree search for grouping DNA sequences by similarity, with runtime experiments and mutation probability estimates on the resulting tree.',
        github: 'https://github.com/rolandsbarkans/lcs-sequence-genealogy'
      },
      {
        title: 'Priority-Based Daily Task Scheduler',
        field: 'comp',
        year: '2025',
        tags: ['Python', 'Data Structures', 'Algorithm Analysis'],
        text: 'A max-heap-based task scheduler that orders a day of dependent tasks by priority, with a complexity analysis across best-, worst-, and average-case inputs verified empirically using linear regression.',
        github: 'https://github.com/rolandsbarkans/task-scheduler'
      },
      {
        title: 'Brewed to Be Random',
        field: 'comp',
        year: '2025',
        tags: ['Python', 'Statistics', 'Probability'],
        text: 'Collected hourly coffee order data at a Seoul café over 7 days and tested whether the counts follow a Poisson distribution using a chi-squared goodness-of-fit test and visual comparison of the observed data against the Poisson PMF.',
        pdf: 'material/projects/brewed_to_be_random.pdf'
      },
    ]
  },
  {
    place: 'Taipei, Taiwan',
    at: { left: 77.2, top: 51.5 },
    size: 4.0,
    projects: [
      {
        title: 'OR-Tools Route Planner',
        featured: true,
        field: 'comp',
        year: '2024',
        tags: ['Python', 'Optimization', 'Operations Research'],
        text: 'A web app that generates optimized multi-vehicle delivery routes across 50 Taipei store locations using Google OR-Tools, with a Leaflet map interface for real-time route inspection and drag-and-drop manual adjustment.',
        github: 'https://github.com/rolandsbarkans/or-tools-route-planner',
        url: 'https://or-tools-route-planner.vercel.app/'
      },
      {
        title: 'Where Do Museum Visitors Go?',
        field: 'comp',
        year: '2024',
        tags: ['Linear Algebra', 'Markov Chains', 'SageMath'],
        text: 'Modeled visitor foot traffic across six rooms on a museum floor in Taipei using a Markov chain, then verified steady-state convergence through three approaches: empirical simulation, matrix regularity, and graph theory.',
        pdf: 'material/projects/where_do_museum_visitors_go.pdf'
      }
    ]
  },
  {
    place: 'Hyderabad, India',
    at: { left: 66, top: 54.3 },
    size: 3.8,
    projects: [
      {
        title: "Soot-Driven Glacier Loss Simulation",
        featured: true,
        field: 'cs',
        year: '2026',
        tags: ['Python', 'Cellular Automata', 'Simulation'],
        text: "A Monte Carlo cellular automata model simulating how black carbon emissions affect glacier melt on a 100×100 spatial grid over 40 years, finding that an 80% emissions reduction extends glacier survival by 3.6 years and cuts peak meltwater discharge by 17%.",
        pdf: 'material/projects/soot_driven_glacier_loss_simulation.pdf'
      },
      {
        title: "Road Network Traffic Simulation",
        field: 'cs',
        year: '2026',
        tags: ['Python', 'Traffic Modelling', 'Graph Theory'],
        text: "A graph-based traffic simulator built on OpenStreetMap data for Berlin, using Dijkstra routing, Poisson congestion analysis, and Google Routes API validation, finding that both a base and extended model explain only ~4–5% of ground-truth congestion variance without fine-grained demand data. Co-authored with Mara Dumitru.",
        pdf: 'material/projects/road_network_traffic_simulation.pdf'
      },
      {
        title: "Sulfate Injection and Ozone Recovery",
        field: 'env',
        year: '2026',
        tags: ['Research Review', 'Climate Science'],
        text: "Reviewed the mechanistic chain by which stratospheric aerosol injection could delay Antarctic ozone recovery by up to 70 years, tracing how aerosol-driven polar vortex intensification extends the polar stratospheric cloud season and accelerates chlorine activation, undermining the progress of the Montreal Protocol.",
        pdf: 'material/projects/sulfate_injection_and_ozone_recovery.pdf'
      },
      {
        title: "From Phyllite To Landslides",
        field: 'env',
        year: '2026',
        tags: ['Field Observations', 'Geochemistry'],
        text: "Traced the landslide susceptibility of the Garhwal Himalaya from sericite's atomic crystal structure through phyllite's foliation fabric to slope-scale failure, arguing that monsoon rainfall acts as the triggering cause on a geological predisposition built over a billion years of Himalayan tectonics.",
        pdf: 'material/projects/from_phyllite_to_landslides.pdf'
      },
      {
        title: "Does Satellite Data Match Air Quality on the Ground?",
        featured: true,
        field: 'env',
        year: '2026',
        tags: ['Remote Sensing', 'Field Observations'],
        text: "Collected 31 days of MODIS Terra and Aqua AOD data over Hyderabad alongside ground PM2.5 readings and a computational haze index built from photographs, finding that satellite aerosol measurements show no significant correlation with surface air quality, and that Hyderabad exceeded the WHO PM2.5 limit every day of the study.",
        pdf: 'material/projects/does_satellite_data_match_air_quality_on_the_ground.pdf'
      }
    ]
  },
  {
    place: 'Buenos Aires, Argentina',
    at: { left: 28.4, top: 85.6 },
    size: 4.0,
    projects: [
      {
        title: 'Predicting Spotify Skips from Album Artwork',
        field: 'comp',
        year: '2025',
        tags: ['Python', 'Machine Learning', 'Computer Vision'],
        text: "Extended a metadata-based Spotify skip prediction model by pulling 2,000 album covers from the Spotify API, embedding them with OpenAI's CLIP model, and training an XGBoost classifier to test whether album visuals could predict my skipping behavior better than listening history alone.",
        github: 'https://github.com/rolandsbarkans/song-skip-prediction-2'
      },
      {
        title: 'Albedo vs. Glacier Thinning in Patagonia',
        field: 'comp',
        year: '2025',
        tags: ['Python', 'Bayesian Statistics', 'Geospatial Analysis'],
        text: "Used satellite data from NASA MODIS and a published glacier dataset to model the relationship between surface reflectivity and ice elevation change across the Southern Patagonian Icefield from 2000 to 2015, comparing five Bayesian models.",
        github: 'https://github.com/rolandsbarkans/patagonian-albedo-elevation'
      },
      {
        title: 'Drought Prediction in the Horn of Africa',
        featured: true,
        field: 'comp',
        year: '2025',
        tags: ['Python', 'Deep Learning', 'NLP', 'Geospatial Analysis'],
        text: "A CNN-LSTM pipeline trained on ERA5-Land reanalysis data to predict monthly drought severity across East Africa at pixel level, reaching 86% accuracy and finding that near-surface temperature and soil moisture drive most predictions. Monthly maps are automatically converted to plain-language summaries via the OpenAI API.",
        github: 'https://github.com/rolandsbarkans/drought-prediction'
      },
      {
        title: 'Fitz Roy Geology',
        field: 'env',
        year: '2025',
        tags: ['Field Observations', 'Earth Science', 'Hypothesis Development'],
        text: "Conducted field observations of a rocky massif in Patagonia's Parque Nacional Los Glaciares, developed two testable hypotheses about tectonic compression and glacial meltwater transport, and connected the site's rock fractures, sediment patterns, and vegetation to Andean plate tectonics and seasonal ice melt.",
        pdf: 'material/projects/fitz_roy_geology.pdf'
      }
    ]
  }
];
