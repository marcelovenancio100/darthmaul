import { apply, branchAndMerge, chain, mergeWith, move, renameTemplateFiles, Rule, SchematicContext, template, Tree, url } from '@angular-devkit/schematics';
import { basename, dirname, experimental, normalize, Path, strings } from '@angular-devkit/core';
import { Schema } from './schema';

export function arqModule(_options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const workspaceConfig = tree.read('/angular.json');
    if(!workspaceConfig) {
      throw new Error('Could not find Angular workspace configuration');
    }

    // Convert workspace settings to string
    const workspaceContent = workspaceConfig.toString();

    // Parse workspace string into JSON object
    const workspace: experimental.workspace.WorkspaceSchema = JSON.parse(
      workspaceContent
    );

    // Get project name
    if(!_options.project) {
      _options.project = workspace.defaultProject;
    }

    const projectName = _options.project as string;
    const project = workspace.projects[projectName];
    const projectType = project.projectType === 'application' ? 'app' : 'lib';

    // Get the path to create files
    if(_options.path === undefined) {
      _options.path = `${project.sourceRoot}/${projectType}`;
    }

    const parsedPath = parseName(_options.path, _options.name);
    _options.name = parsedPath.name;
    _options.path = parsedPath.path;

    // Parse template files
    const templateSource = apply(url('./files'), [
      renameTemplateFiles(),
      template({
        ...strings,
        ..._options,
        classify: strings.classify,
        dasherize: strings.dasherize
      }),
      move(normalize((_options.path + '/' + _options.name) as string))
    ]);

    // Return Rule chain
    return chain([branchAndMerge(chain([mergeWith(templateSource)]))])(
      tree,
      context
    );
  };
}

export function parseName(
  path: string,
  name: string
): { name: string; path: Path } {
  const nameWithoutPath = basename(name as Path);
  const namePath = dirname((path + '/' + name) as Path);

  return {
    name: nameWithoutPath,
    path: normalize('/' + namePath)
  };
}